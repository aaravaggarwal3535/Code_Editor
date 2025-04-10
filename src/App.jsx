import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'

function App() {
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello, world!");')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('vs-dark')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // AI Assistant state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiExplanation, setAIExplanation] = useState('');
  const aiModalRef = useRef(null);

  // Sample starter code for different languages
  const starterCode = {
    javascript: '// Write your JavaScript code here\nconsole.log("Hello, world!");',
    python: '# Write your Python code here\nprint("Hello, world!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}',
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>',
    css: '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}'
  }

  const handleCodeChange = (value) => {
    setCode(value)
  }

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    // Set starter code for the selected language
    setCode(starterCode[newLanguage] || code)
  }

  const handleThemeChange = (e) => {
    setTheme(e.target.value)
  }

  // AI Improve function
  const handleAIImprove = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt for the AI');
      return;
    }
    
    setIsAIProcessing(true);
    
    try {
      const response = await fetch('http://localhost:3001/ai/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language,
          prompt: aiPrompt
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setCode(data.updated_code);
      setAIExplanation(data.explanation);
    } catch (error) {
      console.error('AI processing error:', error);
      setAIExplanation(`Error: ${error.message}`);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Click outside handler for modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (aiModalRef.current && !aiModalRef.current.contains(event.target)) {
        setShowAIModal(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const runCode = async () => {
    setIsLoading(true)
    setOutput('Running code...')

    try {
      if (language === 'javascript' && window.location.hostname === 'localhost') {
        // Run JavaScript in the browser for local development
        let consoleOutput = []
        const originalConsoleLog = console.log
        console.log = (...args) => {
          consoleOutput.push(args.join(' '))
        }
        
        try {
          eval(code)
          setOutput(consoleOutput.join('\n'))
        } catch (error) {
          setOutput(`Error: ${error.message}`)
        }
        
        // Restore original console.log
        console.log = originalConsoleLog
      } else if (language === 'html') {
        // For HTML, create a preview in an iframe
        const iframe = document.createElement('iframe')
        iframe.style.width = '100%'
        iframe.style.height = '300px'
        iframe.style.border = 'none'
        
        const preview = document.getElementById('preview-container')
        preview.innerHTML = ''
        preview.appendChild(iframe)
        
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
        iframeDocument.open()
        iframeDocument.write(code)
        iframeDocument.close()
        
        setOutput('HTML preview rendered below')
      } else if (language === 'css') {
        // For CSS, show a preview with some HTML
        const html = `
          <html>
            <head>
              <style>${code}</style>
            </head>
            <body>
              <div class="container">
                <h1>CSS Preview</h1>
                <p>This is a paragraph to preview your CSS.</p>
                <button>A Button</button>
                <div class="box">A div with class "box"</div>
              </div>
            </body>
          </html>
        `
        
        const iframe = document.createElement('iframe')
        iframe.style.width = '100%'
        iframe.style.height = '300px'
        iframe.style.border = 'none'
        
        const preview = document.getElementById('preview-container')
        preview.innerHTML = ''
        preview.appendChild(iframe)
        
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
        iframeDocument.open()
        iframeDocument.write(html)
        iframeDocument.close()
        
        setOutput('CSS preview rendered below')
      } else {
        // For other languages, send to backend
        setOutput('Sending to backend server...');
        
        const response = await fetch('http://localhost:3001/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, language })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Backend response:', data);
        
        if (data.error && data.error.trim() !== '') {
          setOutput(`${data.result || ''}\n\nError: ${data.error}`);
        } else if (data.result) {
          setOutput(data.result);
        } else {
          setOutput('No output received from the program.');
        }
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Failed to execute code: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const clearOutput = () => {
    setOutput('')
    const preview = document.getElementById('preview-container')
    if (preview) {
      preview.innerHTML = ''
    }
  }

  return (
    <div className="code-editor-container">
      <header>
        <h1>Online Code Editor</h1>
        <div className="controls">
          <select value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
          <select value={theme} onChange={handleThemeChange}>
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <button 
            onClick={() => setShowAIModal(true)}
            className="ai-button"
          >
            AI Assist
          </button>
          <button onClick={runCode} disabled={isLoading}>
            {isLoading ? 'Running...' : 'Run'}
          </button>
          <button onClick={clearOutput}>Clear Output</button>
        </div>
      </header>
      
      <div className="editor-container">
        <Editor
          height="50vh"
          defaultLanguage="javascript"
          language={language}
          theme={theme}
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
      
      <div className="output-section">
        <div className="output-container">
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
        
        <div id="preview-container" className="preview-container"></div>
      </div>
      
      {/* AI Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="ai-modal" ref={aiModalRef}>
            <h3>AI Code Assistant</h3>
            <p>Describe what you want to improve or change in your code:</p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="E.g., Optimize this code for performance, Add error handling, Convert to async/await..."
              rows={4}
              disabled={isAIProcessing}
            />
            
            {aiExplanation && (
              <div className="ai-explanation">
                <h4>AI Explanation:</h4>
                <div>{aiExplanation}</div>
              </div>
            )}
            
            <div className="modal-buttons">
              <button 
                onClick={() => setShowAIModal(false)}
                disabled={isAIProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleAIImprove}
                disabled={isAIProcessing || !aiPrompt.trim()}
                className="primary"
              >
                {isAIProcessing ? 'Processing...' : 'Improve Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
