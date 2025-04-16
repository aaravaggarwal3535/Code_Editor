import API_CONFIG from './apiConfig';

/**
 * Service for executing code using external APIs instead of the local backend.
 * This allows code to run even if the required programming languages are not installed locally.
 */
class ExternalCompilerService {
  /**
   * Execute code using available APIs, with fallback mechanisms
   * @param {string} code - The code to execute
   * @param {string} language - The programming language (python, java, c, cpp)
   * @returns {Promise<{result: string, error: string}>} - The execution result
   */
  static async executeCode(code, language) {
    try {
      // Track if we're using fallback methods
      let usingFallback = false;
      
      // Try the primary backend first
      try {
        const response = await fetch(`${API_CONFIG.LOCAL_API_URL}/external-execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language }),
          // Add timeout for the request
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            result: data.result || '',
            error: data.error || ''
          };
        }
        
        // If we get here, the response wasn't ok, but we'll try fallback
        usingFallback = true;
      } catch (primaryError) {
        console.warn('Primary execution method failed:', primaryError);
        usingFallback = true;
      }
      
      // If primary method failed, try to use the mock execution directly in the browser
      if (usingFallback) {
        console.log('Using browser-based fallback execution');
        return this.mockExecutionInBrowser(code, language);
      }
    } catch (error) {
      console.error('All execution methods failed:', error);
      
      // Provide specific error messages based on the error type
      if (error.name === 'AbortError') {
        return {
          result: '',
          error: 'The request timed out. The execution server might be overloaded or down.'
        };
      } else if (error.message === 'Failed to fetch') {
        return {
          result: '',
          error: 'Connection to code execution server failed. Using backup execution method.'
        };
      } else if (error.message.includes('status: 404')) {
        return {
          result: '',
          error: 'Code execution endpoint not found. Using backup execution method.'
        };
      }
      
      return {
        result: '',
        error: `Failed to execute code: ${error.message}`
      };
    }
  }
  
  /**
   * Browser-based mock execution for basic code samples (fallback mode)
   * @param {string} code - The code to execute 
   * @param {string} language - The programming language
   * @returns {{result: string, error: string}} - Simulated execution result
   */
  static mockExecutionInBrowser(code, language) {
    // Add a slight delay to simulate processing
    return new Promise(resolve => {
      setTimeout(() => {
        let result = '';
        let error = '';
        
        try {
          switch (language) {
            case 'javascript':
              // For JavaScript, we can actually execute it in the browser
              try {
                // Create a safe evaluation context
                const outputCapture = [];
                const mockConsole = {
                  log: (...args) => outputCapture.push(args.join(' ')),
                  error: (...args) => outputCapture.push(`Error: ${args.join(' ')}`),
                  warn: (...args) => outputCapture.push(`Warning: ${args.join(' ')}`),
                  info: (...args) => outputCapture.push(args.join(' '))
                };
                
                // Execute in a controlled context
                const safeEval = new Function('console', `
                  try {
                    ${code}
                    return { success: true, output: [] };
                  } catch (e) {
                    return { success: false, error: e.message };
                  }
                `);
                
                const evalResult = safeEval(mockConsole);
                
                if (evalResult.success) {
                  result = outputCapture.join('\n') || 'Code executed successfully (no output)';
                } else {
                  error = evalResult.error;
                }
              } catch (jsError) {
                error = `JavaScript execution error: ${jsError.message}`;
              }
              break;
              
            case 'python':
              if (code.includes('print(')) {
                // Extract what's being printed (simple cases)
                const printMatches = code.match(/print\(['"](.+?)['"]\)/g);
                if (printMatches) {
                  const outputLines = printMatches.map(match => {
                    const content = match.match(/print\(['"](.+?)['"]\)/);
                    return content ? content[1] : '';
                  });
                  result = outputLines.join('\n');
                } else {
                  result = '(Output would appear here when connected to execution server)';
                }
              } else {
                result = 'Code executed in fallback mode (outputs limited)';
              }
              break;
              
            case 'java':
              if (code.includes('System.out.println')) {
                // Extract print statements (simple cases)
                const printMatches = code.match(/System\.out\.println\(['"](.+?)['"]\)/g);
                if (printMatches) {
                  const outputLines = printMatches.map(match => {
                    const content = match.match(/System\.out\.println\(['"](.+?)['"]\)/);
                    return content ? content[1] : '';
                  });
                  result = outputLines.join('\n');
                } else {
                  result = '(Output would appear here when connected to execution server)';
                }
              } else {
                result = 'Java code processed in fallback mode (limited functionality)';
              }
              break;
              
            case 'cpp':
            case 'c':
              if (code.includes('cout <<') || code.includes('printf')) {
                // Try to extract print statements
                const coutMatches = code.match(/cout\s*<<\s*['"](.+?)['"]/g);
                const printfMatches = code.match(/printf\s*\(\s*['"]([^%]*)['"]/g);
                
                if (coutMatches) {
                  const outputLines = coutMatches.map(match => {
                    const content = match.match(/cout\s*<<\s*['"](.+?)['"]/);
                    return content ? content[1] : '';
                  });
                  result = outputLines.join('\n');
                } else if (printfMatches) {
                  const outputLines = printfMatches.map(match => {
                    const content = match.match(/printf\s*\(\s*['"]([^%]*)['"]/);
                    return content ? content[1] : '';
                  });
                  result = outputLines.join('\n');
                } else {
                  result = '(Output would appear here when connected to execution server)';
                }
              } else {
                result = `${language.toUpperCase()} code processed in fallback mode (limited functionality)`;
              }
              break;
              
            default:
              result = `${language} code processed in fallback mode`;
          }
          
          resolve({
            result: result,
            error: error,
            note: 'Running in fallback mode - limited functionality. Backend connection failed.'
          });
        } catch (fallbackError) {
          resolve({
            result: '',
            error: `Fallback execution failed: ${fallbackError.message}`,
            note: 'Please try again later when the execution server is available.'
          });
        }
      }, 500); // Small delay to simulate processing
    });
  }
  
  /**
   * Checks if the given language needs external execution
   * @param {string} language - The programming language
   * @returns {boolean} - True if external execution is needed
   */
  static needsExternalExecution(language) {
    return ['python', 'java', 'c', 'cpp'].includes(language);
  }
}

export default ExternalCompilerService;