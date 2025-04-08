import { useState } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'

function App() {
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello, world!");')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('vs-dark')
  const [output, setOutput] = useState('')

  const handleCodeChange = (value) => {
    setCode(value)
  }

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value)
  }

  const handleThemeChange = (e) => {
    setTheme(e.target.value)
  }

  const runCode = () => {
    try {
      // For JavaScript, we can use eval in this simple example
      // In a production environment, you'd want a safer approach
      if (language === 'javascript') {
        // Create a safe output capture
        let consoleOutput = []
        const originalConsoleLog = console.log
        console.log = (...args) => {
          consoleOutput.push(args.join(' '))
        }
        
        eval(code)
        
        // Restore original console.log
        console.log = originalConsoleLog
        
        setOutput(consoleOutput.join('\n'))
      } else {
        setOutput('Running code in languages other than JavaScript requires a backend service.')
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    }
  }

  const clearOutput = () => {
    setOutput('')
  }

  return (
    <div className="code-editor-container">
      <header>
        <h1>Online Code Editor</h1>
        <div className="controls">
          <select value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
          </select>
          <select value={theme} onChange={handleThemeChange}>
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <button onClick={runCode}>Run</button>
          <button onClick={clearOutput}>Clear Output</button>
        </div>
      </header>
      
      <div className="editor-container">
        <Editor
          height="70vh"
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
      
      <div className="output-container">
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  )
}

export default App
