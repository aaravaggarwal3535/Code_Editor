import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'

function App() {
  // Core state
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello, world!");')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('vs-dark')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // UI state
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isOutputExpanded, setIsOutputExpanded] = useState(false)
  
  // AI Assistant state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAIPrompt] = useState('')
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiExplanation, setAIExplanation] = useState('')
  const aiModalRef = useRef(null)
  const previewRef = useRef(null)

  // Language configurations
  const starterCode = {
    javascript: '// Write your JavaScript code here\nconsole.log("Hello, world!");',
    python: '# Write your Python code here\nprint("Hello, world!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}',
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>',
    css: '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}'
  }

  const languageIcons = {
    javascript: '📜',
    python: '🐍',
    java: '☕',
    cpp: '⚙️',
    html: '🌐',
    css: '🎨'
  }

  // Event handlers
  const handleCodeChange = (value) => {
    setCode(value || '')
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(starterCode[lang] || code)
    clearOutput()
  }

  const handleThemeChange = (e) => {
    setTheme(e.target.value)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen)
  }

  const toggleOutputPanel = () => {
    setIsOutputExpanded(!isOutputExpanded)
  }

  // AI Assistant functions
  const openAIModal = () => setShowAIModal(true)
  
  const closeAIModal = () => {
    setShowAIModal(false)
    setAIPrompt('')
    setAIExplanation('')
  }

  const handleAIPromptChange = (e) => {
    setAIPrompt(e.target.value)
  }

  const handleAIImprove = async () => {
    if (!aiPrompt.trim()) {
      return
    }
    
    setIsAIProcessing(true)
    
    try {
      const response = await fetch('http://localhost:3001/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, prompt: aiPrompt })
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      setCode(data.updated_code)
      setAIExplanation(data.explanation)
    } catch (error) {
      console.error('AI processing error:', error)
      setAIExplanation(`Error: ${error.message}`)
    } finally {
      setIsAIProcessing(false)
    }
  }

  // Click outside handler for AI modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiModalRef.current && !aiModalRef.current.contains(event.target)) {
        closeAIModal()
      }
    }
    
    if (showAIModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAIModal])

  // Code execution
  const runCode = async () => {
    setIsLoading(true)
    setOutput('Running code...')
    setIsOutputExpanded(true)

    try {
      if (language === 'javascript' && window.location.hostname === 'localhost') {
        // Run JavaScript in the browser
        let consoleOutput = []
        const originalConsoleLog = console.log
        console.log = (...args) => {
          consoleOutput.push(args.join(' '))
        }
        
        try {
          eval(code)
          setOutput(consoleOutput.join('\n') || 'Code executed successfully (no output)')
        } catch (error) {
          setOutput(`Error: ${error.message}`)
        }
        
        console.log = originalConsoleLog
      } else if (language === 'html') {
        // For HTML, render preview
        renderHTMLPreview(code)
        setOutput('HTML preview rendered')
      } else if (language === 'css') {
        // For CSS, render with test HTML
        renderCSSPreview(code)
        setOutput('CSS preview rendered')
      } else {
        // For other languages, send to backend
        await executeOnBackend()
      }
    } catch (error) {
      console.error('Code execution error:', error)
      setOutput(`Failed to execute code: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to execute code on the backend
  const executeOnBackend = async () => {
    try {
      const response = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error && data.error.trim() !== '') {
        setOutput(`${data.result || ''}\n\nError: ${data.error}`)
      } else if (data.result) {
        setOutput(data.result)
      } else {
        setOutput('No output received from the program.')
      }
    } catch (error) {
      throw error
    }
  }

  // HTML/CSS preview rendering
  const renderHTMLPreview = (htmlCode) => {
    if (!previewRef.current) return
    
    const iframe = document.createElement('iframe')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    
    previewRef.current.innerHTML = ''
    previewRef.current.appendChild(iframe)
    
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
    iframeDocument.open()
    iframeDocument.write(htmlCode)
    iframeDocument.close()
  }

  const renderCSSPreview = (cssCode) => {
    if (!previewRef.current) return
    
    const html = `
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>
          <div style="padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <h1>CSS Preview</h1>
            <p>This is a paragraph to preview your CSS styling.</p>
            <button>Button Element</button>
            <div className="box" style="margin-top: 20px; padding: 15px; border: 1px solid #ccc;">
              A div with class "box"
            </div>
            <ul style="margin-top: 20px;">
              <li>List item 1</li>
              <li>List item 2</li>
              <li>List item 3</li>
            </ul>
          </div>
        </body>
      </html>
    `
    
    const iframe = document.createElement('iframe')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    
    previewRef.current.innerHTML = ''
    previewRef.current.appendChild(iframe)
    
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
    iframeDocument.open()
    iframeDocument.write(html)
    iframeDocument.close()
  }

  // Clear output and preview
  const clearOutput = () => {
    setOutput('')
    if (previewRef.current) {
      previewRef.current.innerHTML = ''
    }
  }

  // Get filename based on language
  const getFileName = () => {
    switch (language) {
      case 'javascript': return 'script.js'
      case 'python': return 'main.py'
      case 'java': return 'Main.java'
      case 'cpp': return 'main.cpp'
      case 'html': return 'index.html'
      case 'css': return 'styles.css'
      default: return 'file.txt'
    }
  }

  // Render the UI
  return (
    <div className={`editor-container ${theme === 'vs-dark' ? '' : 'light-theme'}`}>
      {/* Header */}
      <header className="editor-header">
        <div className="editor-title">
          <span className="editor-logo">⌨️</span>
          <span>Code Editor - {getFileName()}</span>
        </div>
        <div className="editor-controls">
          <button onClick={toggleSidebar} className="toolbar-button">
            {isSidebarOpen ? '◀ Hide Sidebar' : '▶ Show Sidebar'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="editor-main">
        {/* Sidebar */}
        <aside className={`editor-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-header">
            <span>Explorer</span>
            <button className="sidebar-toggle" onClick={toggleSidebar}>×</button>
          </div>
          
          <div className="sidebar-content">
            <div className="sidebar-section">
              <div className="section-title">Languages</div>
              <div className="language-selector">
                {Object.keys(starterCode).map((lang) => (
                  <div 
                    key={lang}
                    className={`language-item ${language === lang ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <span className="language-icon">{languageIcons[lang]}</span>
                    <span>{lang.charAt(0).toUpperCase() + lang.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sidebar-section">
              <div className="section-title">Settings</div>
              <div className="theme-selector">
                <label htmlFor="theme-select">Editor Theme</label>
                <select 
                  id="theme-select"
                  value={theme} 
                  onChange={handleThemeChange}
                >
                  <option value="vs-dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>

            <button 
              onClick={runCode} 
              disabled={isLoading} 
              className="run-button-sidebar"
            >
              {isLoading ? '⏳ Running...' : '▶ Run Code'}
            </button>
          </div>
        </aside>

        {/* Editor content */}
        <main className="editor-content">
          <div className="editor-tabs">
            <div className="editor-tab active">
              <span className="language-icon">{languageIcons[language]}</span>
              <span className="tab-name">{getFileName()}</span>
            </div>
          </div>

          <div className="monaco-editor-wrapper">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                tabSize: 2,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto'
                }
              }}
            />
          </div>

          {/* Toolbar */}
          <div className="editor-toolbar">
            <button 
              onClick={runCode} 
              disabled={isLoading} 
              className="toolbar-button primary"
              title="Run code (Ctrl+Enter)"
            >
              {isLoading ? '⏳ Running...' : '▶ Run'}
            </button>
            <button 
              onClick={openAIModal} 
              className="toolbar-button ai"
              title="Get AI assistance"
            >
              🤖 AI Assist
            </button>
            <div className="toolbar-spacer"></div>
            <button 
              onClick={clearOutput} 
              className="toolbar-button"
              title="Clear output"
            >
              🧹 Clear
            </button>
          </div>

          {/* Output panel */}
          <div className={`output-panel ${isOutputExpanded ? '' : 'collapsed'}`}>
            <div className="output-header" onClick={toggleOutputPanel}>
              <h3>Output</h3>
              <div className="output-controls">
                <button className="output-control" onClick={(e) => {
                  e.stopPropagation();
                  clearOutput();
                }} title="Clear output">
                  🧹
                </button>
                <button className="output-control" onClick={(e) => {
                  e.stopPropagation();
                  toggleOutputPanel();
                }} title="Toggle panel">
                  {isOutputExpanded ? '▼' : '▲'}
                </button>
              </div>
            </div>
            <div className="output-content">
              <pre>{output}</pre>
              {(language === 'html' || language === 'css') && (
                <div ref={previewRef} className="preview-container"></div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Status bar */}
      <footer className="status-bar">
        <div className="status-left">
          <div className="status-item">
            {languageIcons[language]} {language.charAt(0).toUpperCase() + language.slice(1)}
          </div>
        </div>
        <div className="status-right">
          <div className="status-item">
            {theme === 'vs-dark' ? '🌙 Dark' : '☀️ Light'}
          </div>
        </div>
      </footer>

      {/* AI Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="ai-modal" ref={aiModalRef}>
            <div className="modal-header">
              <span>🤖</span>
              <h2>AI Code Assistant</h2>
            </div>
            <div className="modal-content">
              <label htmlFor="ai-prompt">Describe what you want to improve:</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={handleAIPromptChange}
                placeholder="E.g., Optimize this code, Add error handling, Convert to async/await..."
                rows={4}
                disabled={isAIProcessing}
              />
              
              {aiExplanation && (
                <div className="ai-explanation">
                  <strong>AI Explanation:</strong>
                  <p>{aiExplanation}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={closeAIModal}
                className="toolbar-button"
                disabled={isAIProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleAIImprove}
                className="toolbar-button primary"
                disabled={isAIProcessing || !aiPrompt.trim()}
              >
                {isAIProcessing ? '⏳ Processing...' : '✨ Improve Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
