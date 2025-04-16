// Simple Express server for code execution
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Hardcoded Groq API key (not recommended for production but implemented as requested)
const HARDCODED_GROQ_API_KEY = "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";

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify functions
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'code-execution-backend' });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    name: 'GeistCode Execution API',
    version: '1.0.0'
  });
});

// Languages supported endpoint
app.get('/languages', (req, res) => {
  res.status(200).json({
    supported: {
      javascript: true,  // Node.js is always available
      python: installedLanguages.python,
      java: installedLanguages.java,
      cpp: installedLanguages.cpp,
      c: installedLanguages.c
    },
    version: process.env.VERSION || '1.0.0'
  });
});

// Execute the language verification script if in Railway environment
const verifyLanguageInstallation = async () => {
  try {
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('Running in Railway environment, verifying language support...');
      const scriptPath = path.join(__dirname, 'check-languages.sh');
      
      // Make the script executable
      await execAsync(`chmod +x "${scriptPath}"`);
      
      // Run the verification script
      const { stdout, stderr } = await execAsync(`"${scriptPath}"`);
      console.log('Language verification results:', stdout);
      if (stderr) {
        console.error('Verification errors:', stderr);
      }
    }
  } catch (error) {
    console.error('Failed to verify language installations:', error);
  }
};

// Check for installed compilers and interpreters
const checkInstalledLanguages = async () => {
  const languages = {
    javascript: { name: 'Node.js', command: 'node --version' },
    python: { name: 'Python', command: 'python --version || python3 --version' },
    java: { name: 'Java', command: 'java -version' },
    cpp: { name: 'C++', command: 'g++ --version' },
    c: { name: 'C', command: 'gcc --version' }
  };

  const results = {};
  
  for (const [lang, info] of Object.entries(languages)) {
    try {
      await execAsync(info.command);
      results[lang] = true;
      console.log(`✅ ${info.name} is installed`);
    } catch (e) {
      results[lang] = false;
      console.log(`❌ ${info.name} is not installed`);
    }
  }
  
  return results;
};

// Call this at server startup
let installedLanguages = {};

// Run both initialization functions
const initializeServer = async () => {
  try {
    // First verify language installations if in Railway
    await verifyLanguageInstallation();
    
    // Then check which languages are properly installed
    installedLanguages = await checkInstalledLanguages();
    console.log('Language support initialized:', installedLanguages);
  } catch (error) {
    console.error('Error during server initialization:', error);
  }
};

// Initialize the server
initializeServer();

// Simple execute endpoint
app.post('/execute', async (req, res) => {
  const { code, language } = req.body;
  const timestamp = Date.now();
  let filePath;
  let command;

  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Check if language is supported on this server
    if (!installedLanguages[language]) {
      // Provide more specific guidance based on the language
      const installationGuide = {
        python: 'Install Python from https://www.python.org/downloads/',
        java: 'Install Java Development Kit (JDK) from https://www.oracle.com/java/technologies/downloads/',
        cpp: 'Install a C++ compiler like G++ (part of GCC) or MinGW on Windows',
        c: 'Install a C compiler like GCC or MinGW on Windows'
      };
      
      const guide = installationGuide[language] || '';
      const installMsg = guide ? ` You can: ${guide}` : '';
      
      return res.json({ 
        result: '', 
        error: `Language "${language}" is not supported on this server. Required compiler/interpreter is not installed.${installMsg}` 
      });
    }
    
    switch (language) {
      case 'javascript':
        filePath = path.join(tempDir, `code_${timestamp}.js`);
        await writeFileAsync(filePath, code);
        
        try {
          // Execute JavaScript with Node.js
          const { stdout, stderr } = await execAsync(`node "${filePath}"`, { timeout: 10000 });
          
          // Clean up the file
          try {
            await unlinkAsync(filePath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (error) {
          return res.json({ result: '', error: error.message });
        }
        
      case 'python':
        filePath = path.join(tempDir, `code_${timestamp}.py`);
        await writeFileAsync(filePath, code);
        
        try {
          // Try python3 first (most common on cloud platforms)
          try {
            const { stdout, stderr } = await execAsync(`python3 "${filePath}"`, { timeout: 10000 });
            
            // Clean up the file
            try {
              await unlinkAsync(filePath);
            } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
            }
            
            return res.json({ result: stdout, error: stderr });
          } catch (python3Error) {
            // Fall back to 'python' if 'python3' fails
            const { stdout, stderr } = await execAsync(`python "${filePath}"`, { timeout: 10000 });
            
            // Clean up the file
            try {
              await unlinkAsync(filePath);
            } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
            }
            
            return res.json({ result: stdout, error: stderr });
          }
        } catch (pythonError) {
          return res.json({ result: '', error: pythonError.message });
        }
      
      case 'java':
        // For Java, we need to extract the class name
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : `Main${timestamp}`;
        
        // If no public class was found, wrap the code in a Main class
        let javaCode = code;
        if (!classNameMatch) {
          javaCode = `
public class ${className} {
    public static void main(String[] args) {
${code.split('\n').map(line => '        ' + line).join('\n')}
    }
}`;
        }
        
        filePath = path.join(tempDir, `${className}.java`);
        await writeFileAsync(filePath, javaCode);
        
        try {
          // First compile the Java code
          const compileResult = await execAsync(`javac "${filePath}"`, { timeout: 15000 });
          console.log('Java compilation output:', compileResult.stderr || 'no output');
          
          // Then run the compiled class file
          const { stdout, stderr } = await execAsync(`java -cp "${tempDir}" ${className}`, { timeout: 10000 });
          
          // Clean up the files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(path.join(tempDir, `${className}.class`));
          } catch (cleanupError) {
            console.error('Java cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (javaError) {
          console.error('Java execution error:', javaError);
          return res.json({ result: '', error: javaError.message });
        }
      
      case 'cpp':
        filePath = path.join(tempDir, `code_${timestamp}.cpp`);
        const cppOutputPath = path.join(tempDir, `code_${timestamp}.exe`);
        await writeFileAsync(filePath, code);
        
        try {
          // First compile the C++ code
          console.log(`Compiling C++ code: g++ "${filePath}" -o "${cppOutputPath}"`);
          const compileResult = await execAsync(`g++ "${filePath}" -o "${cppOutputPath}"`, { timeout: 15000 });
          console.log('C++ compilation output:', compileResult.stderr || 'no output');
          
          // Then run the compiled executable
          const { stdout, stderr } = await execAsync(`"${cppOutputPath}"`, { timeout: 10000 });
          
          // Clean up the files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(cppOutputPath);
          } catch (cleanupError) {
            console.error('C++ cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (cppError) {
          console.error('C++ execution error:', cppError);
          return res.json({ result: '', error: cppError.message });
        }
      
      case 'c':
        filePath = path.join(tempDir, `code_${timestamp}.c`);
        const cOutputPath = path.join(tempDir, `code_${timestamp}.exe`);
        await writeFileAsync(filePath, code);
        
        try {
          // First compile the C code
          console.log(`Compiling C code: gcc "${filePath}" -o "${cOutputPath}"`);
          const compileResult = await execAsync(`gcc "${filePath}" -o "${cOutputPath}"`, { timeout: 15000 });
          console.log('C compilation output:', compileResult.stderr || 'no output');
          
          // Then run the compiled executable
          const { stdout, stderr } = await execAsync(`"${cOutputPath}"`, { timeout: 10000 });
          
          // Clean up the files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(cOutputPath);
          } catch (cleanupError) {
            console.error('C cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (cError) {
          console.error('C execution error:', cError);
          return res.json({ result: '', error: cError.message });
        }
      
      default:
        // For other languages, return a message that it's not supported yet
        return res.json({ 
          result: '', 
          error: `Language "${language}" is not yet supported.` 
        });
    }
  } catch (error) {
    console.error('Execution error:', error);
    res.json({ result: '', error: error.message });
  }
});

// Proxy the AI requests
app.post('/ai/improve', async (req, res) => {
  try {
    const { code, language, prompt, session_id } = req.body;
    
    console.log(`Processing AI request for language: ${language}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Code length: ${code.length} characters`);
    
    // Check if we're using an external AI service or implementing it directly
    
    // Import the Groq SDK if needed
    let Groq;
    try {
      Groq = (await import('groq-sdk')).default;
    } catch (error) {
      console.error('Failed to import Groq SDK:', error);
      return res.status(200).json({
        updated_code: code, // Return the original code
        explanation: "AI service is temporarily unavailable. The groq-sdk module couldn't be loaded. Please try again later or contact support.",
        session_id: session_id || 'new_session',
        error: true
      });
    }
    
    // Check for API key
    const groqApiKey = "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";
    if (!groqApiKey) {
      console.error('No GROQ_API_KEY found in environment variables');
      return res.status(200).json({
        updated_code: code, // Return the original code
        explanation: "AI service is temporarily unavailable. The GROQ_API_KEY environment variable is not set. Please contact the administrator to set up the API key.",
        session_id: session_id || 'new_session',
        error: true
      });
    }
    
    // Initialize Groq client
    const groqClient = new Groq({ apiKey: groqApiKey });
    const MODEL_NAME = "llama3-70b-8192";  // Groq's Llama 3 70B model
    
    // Create a prompt for the Groq model
    const userPrompt = `
      Please improve this ${language} code according to these requirements:
      
      ${prompt}
      
      Here is the code to improve:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      First provide ONLY the improved code without any explanation or markdown formatting.
      Then on a new line write "EXPLANATION:" followed by your explanation of the changes.
    `;
    
    // Call Groq API
    const messages = [
      {
        role: "system", 
        content: "You are an expert programmer focusing on improving code. You provide clear, detailed explanations of your changes."
      },
      { role: "user", content: userPrompt }
    ];
    
    console.log("Sending request to Groq API...");
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.2,
      max_tokens: 4000,
    });
    
    const result = response.choices[0].message.content;
    console.log(`Received response from Groq API. Length: ${result.length} characters`);
    
    // Parse the result to separate code and explanation
    let parts = result.split("EXPLANATION:");
    let updatedCode, explanation;
    
    if (parts.length > 1) {
      updatedCode = parts[0].trim();
      explanation = parts[1].trim();
    } else {
      // Simple fallback if no EXPLANATION marker
      const lines = result.split('\n');
      const splitPoint = Math.floor(lines.length * 0.7);
      updatedCode = lines.slice(0, splitPoint).join('\n').trim();
      explanation = lines.slice(splitPoint).join('\n').trim();
    }
    
    // Clean up the code (remove markdown code blocks if present)
    if (updatedCode.startsWith("```")) {
      const codeLines = updatedCode.split('\n');
      // Find start and end of code block
      const startIndex = codeLines.findIndex(line => line.includes("```")) + 1;
      const endIndex = codeLines.slice(startIndex).findIndex(line => line.includes("```")) + startIndex;
      
      if (endIndex > startIndex) {
        updatedCode = codeLines.slice(startIndex, endIndex).join('\n');
      } else {
        updatedCode = codeLines.slice(startIndex).join('\n');
      }
    }
    
    return res.json({
      updated_code: updatedCode,
      explanation: explanation,
      session_id: session_id || 'new_session'
    });
    
  } catch (error) {
    console.error('AI service error:', error.message);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    
    // Return a user-friendly error as a regular response, not a 500 error
    return res.status(200).json({
      updated_code: req.body.code, // Return the original code
      explanation: `AI service encountered an error: ${error.message}. Please try again later or with a different prompt.`,
      session_id: req.body.session_id || 'new_session',
      error: true
    });
  }
});

// External execution endpoint using Judge0 API
app.post('/external-execute', async (req, res) => {
  const { code, language } = req.body;
  
  try {
    console.log(`Processing external execution request for language: ${language}`);
    console.log(`Code length: ${code.length} characters`);
    
    // If the language is installed locally, use local execution instead
    if (installedLanguages[language]) {
      console.log(`${language} is installed locally, redirecting to local execution`);
      
      // Internally forward to the normal execution endpoint
      req.url = '/execute';
      return app._router.handle(req, res);
    }
    
    // Choose which external API to use
    const useJudge0 = process.env.USE_JUDGE0 === 'true';
    const useJDoodle = process.env.USE_JDOODLE === 'true';
    
    // Check if we have the necessary API keys
    const judge0ApiKey = process.env.JUDGE0_API_KEY;
    const jdoodleClientId = process.env.JDOODLE_CLIENT_ID;
    const jdoodleClientSecret = process.env.JDOODLE_CLIENT_SECRET;
    
    // Default to Judge0 if both are available
    if (useJudge0 && judge0ApiKey) {
      return await executeWithJudge0(code, language, judge0ApiKey, res);
    } 
    // Fall back to JDoodle if available
    else if (useJDoodle && jdoodleClientId && jdoodleClientSecret) {
      return await executeWithJDoodle(code, language, jdoodleClientId, jdoodleClientSecret, res);
    }
    // If no API keys are available, use a mock execution for demo purposes
    else {
      return await mockExecutionForDemo(code, language, res);
    }
  } catch (error) {
    console.error('External execution error:', error);
    return res.status(500).json({ 
      result: '', 
      error: `Failed to execute code: ${error.message}` 
    });
  }
});

// Mock execution function for demo/testing
async function mockExecutionForDemo(code, language, res) {
  console.log('Using mock execution (no API keys configured)');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create sample outputs based on language
  let result = '';
  
  switch (language) {
    case 'python':
      if (code.includes('print(')) {
        // Extract what's being printed
        const printMatch = code.match(/print\(['"](.*)['"]\)/);
        result = printMatch ? printMatch[1] + '\n' : 'Hello, world!\n';
      } else {
        result = 'Program executed successfully.\n';
      }
      break;
    
    case 'java':
      if (code.includes('System.out.println')) {
        // Extract what's being printed
        const printMatch = code.match(/System\.out\.println\(['"](.*)['"]\)/);
        result = printMatch ? printMatch[1] + '\n' : 'Hello, world!\n';
      } else {
        result = 'Java program compiled and executed successfully.\n';
      }
      break;
      
    case 'cpp':
    case 'c':
      if (code.includes('cout <<') || code.includes('printf')) {
        // Extract what's being printed (simple cases)
        const coutMatch = code.match(/cout\s*<<\s*['"](.*)['"]/);
        const printfMatch = code.match(/printf\s*\(\s*['"](.*?)['"]/);
        result = coutMatch ? coutMatch[1] + '\n' : 
                printfMatch ? printfMatch[1] + '\n' : 'Hello, world!\n';
      } else {
        result = 'Program compiled and executed successfully.\n';
      }
      break;
      
    default:
      result = 'Program executed successfully.\n';
  }
  
  return res.json({ 
    result: result,
    error: '',
    note: 'This is a simulated response. Configure API keys for actual execution.'
  });
}

// Execute code using Judge0 API
async function executeWithJudge0(code, language, apiKey, res) {
  console.log('Executing code with Judge0 API');
  
  // Get the Judge0 language ID
  const languageIds = {
    python: 71, // Python 3
    java: 62,   // Java 
    cpp: 54,    // C++
    c: 50       // C
  };
  
  const languageId = languageIds[language] || 71;
  
  try {
    // Create a submission
    const createResponse = await axios.post('https://judge0-ce.p.rapidapi.com/submissions', {
      language_id: languageId,
      source_code: code,
      stdin: '', // Input can be added here if needed
    }, {
      headers: {
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.data.token) {
      throw new Error('Failed to get submission token');
    }
    
    const token = createResponse.data.token;
    
    // Wait for the result (with timeout)
    let result;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': apiKey,
        }
      });
      
      if (resultResponse.data.status && resultResponse.data.status.id > 2) {
        // Status > 2 means processing is done (whether successfully or with error)
        result = resultResponse.data;
        break;
      }
      
      attempts++;
    }
    
    if (!result) {
      throw new Error('Execution timed out');
    }
    
    // Handle the result
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const compile_output = result.compile_output || '';
    
    return res.json({
      result: stdout,
      error: stderr || compile_output,
      status: result.status ? result.status.description : 'Unknown'
    });
    
  } catch (error) {
    console.error('Judge0 API error:', error);
    return res.status(500).json({ 
      result: '', 
      error: `Failed to execute code using Judge0: ${error.message}` 
    });
  }
}

// Execute code using JDoodle API
async function executeWithJDoodle(code, language, clientId, clientSecret, res) {
  console.log('Executing code with JDoodle API');
  
  // Map our languages to JDoodle's language codes
  const languageMap = {
    python: { language: 'python3', versionIndex: '3' },
    java: { language: 'java', versionIndex: '0' },
    cpp: { language: 'cpp17', versionIndex: '0' },
    c: { language: 'c', versionIndex: '4' }
  };
  
  const langConfig = languageMap[language] || languageMap.python;
  
  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      clientId: clientId,
      clientSecret: clientSecret,
      script: code,
      language: langConfig.language,
      versionIndex: langConfig.versionIndex
    });
    
    return res.json({
      result: response.data.output,
      error: response.data.error || '',
      memory: response.data.memory,
      cpuTime: response.data.cpuTime
    });
    
  } catch (error) {
    console.error('JDoodle API error:', error);
    return res.status(500).json({ 
      result: '', 
      error: `Failed to execute code using JDoodle: ${error.message}` 
    });
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});