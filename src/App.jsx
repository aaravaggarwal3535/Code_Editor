import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello, world!");')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('vs-dark')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
        // Send code to backend for execution
        const response = await fetch('http://localhost:3001/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, language })
        })
        
        const data = await response.json()
        
        if (data.error) {
          setOutput(`${data.result}\nError: ${data.error}`)
        } else {
          setOutput(data.result)
        }
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearOutput = () => {
    setOutput('')
    const preview = document.getElementById('preview-container')
    if (preview) {
      preview.innerHTML = ''
    }
  }

  const goToHome = () => {
    navigate('/')
  }

  return (
    <div className="code-editor-container">
      <header>
        <div className="header-left">
          <button className="back-button" onClick={goToHome}>
            ← Back to Home
          </button>
          <h1>Online Code Editor</h1>
        </div>
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
    </div>
  )
}

export default App
