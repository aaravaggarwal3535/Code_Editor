import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'
import ExternalCompilerService from './externalCompilerService'
import API_CONFIG from './apiConfig'

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
  const [aiSessionId, setAISessionId] = useState(null)  // Store the session ID
  const [aiConversationHistory, setAIConversationHistory] = useState([]) // Store conversation history
  const [aiExplanation, setAIExplanation] = useState('')
  const aiModalRef = useRef(null)
  const previewRef = useRef(null)

  // File Explorer state
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFile, setCurrentFile] = useState(null)
  const [showCreateFileModal, setShowCreateFileModal] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [activeSidebarItem, setActiveSidebarItem] = useState('explorer')
  const createModalRef = useRef(null)
  const createFolderModalRef = useRef(null)
  const renameModalRef = useRef(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [itemToRename, setItemToRename] = useState(null)
  const [newItemName, setNewItemName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState({})

  // Language configurations
  const starterCode = {
    javascript: '// Write your JavaScript code here\nconsole.log("Hello, world!");',
    python: '# Write your Python code here\nprint("Hello, world!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}',
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>',
    css: '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}'
  }

  const languageIcons = {
    javascript: '📜',
    python: '🐍',
    java: '☕',
    cpp: '⚙️',
    c: '🔧',
    html: '🌐',
    css: '🎨',
    txt: '📄',
    md: '📝',
    json: '📊',
    default: '📄'
  }

  // Initialize files and folders
  useEffect(() => {
    // Sample initial file structure
    setFiles([
      { id: '1', name: 'script.js', type: 'javascript', content: starterCode.javascript, parent: null },
      { id: '2', name: 'main.py', type: 'python', content: starterCode.python, parent: null },
      { id: '3', name: 'styles.css', type: 'css', content: starterCode.css, parent: null },
      { id: '4', name: 'index.html', type: 'html', content: starterCode.html, parent: null },
      { id: '5', name: 'config.json', type: 'json', content: '{\n  "name": "My Project",\n  "version": "1.0.0"\n}', parent: 'folder1' },
      { id: '6', name: 'README.md', type: 'md', content: '# My Project\n\nThis is a sample project.', parent: null },
      { id: '7', name: 'utils.js', type: 'javascript', content: '// Utility functions\nfunction formatDate(date) {\n  return date.toLocaleDateString();\n}\n\nfunction formatTime(date) {\n  return date.toLocaleTimeString();\n}', parent: 'folder2' }
    ])

    setFolders([
      { id: 'folder1', name: 'config', parent: null },
      { id: 'folder2', name: 'utils', parent: null },
      { id: 'folder3', name: 'assets', parent: null },
      { id: 'folder4', name: 'scripts', parent: 'folder3' }
    ])

    setCurrentFile({ id: '1', name: 'script.js', type: 'javascript', content: starterCode.javascript, parent: null })
    
    // Set initial expanded state
    setExpandedFolders({
      'folder1': true,
      'folder2': true,
      'folder3': false
    })
  }, [])

  // Event handlers
  const handleCodeChange = (value) => {
    setCode(value || '')
    if (currentFile) {
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === currentFile.id ? {...file, content: value || ''} : file
        )
      )
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    if (!currentFile) {
      setCode(starterCode[lang] || code)
      clearOutput()
    }
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

  // File operations
  const openFile = (file) => {
    setCurrentFile(file)
    setLanguage(file.type)
    setCode(file.content)
    clearOutput()
  }

  const createNewFile = () => {
    setShowCreateFileModal(true)
  }

  const handleCreateFile = () => {
    if (!newFileName.trim()) return
    
    let fileType = 'txt'
    const fileExt = newFileName.split('.').pop().toLowerCase()
    
    if (Object.keys(starterCode).includes(fileExt)) {
      fileType = fileExt
    } else if (fileExt === 'md' || fileExt === 'json' || fileExt === 'txt') {
      fileType = fileExt
    }
    
    const newFile = {
      id: `file_${Date.now()}`,
      name: newFileName,
      type: fileType,
      content: starterCode[fileType] || '',
      parent: null
    }
    
    setFiles(prevFiles => [...prevFiles, newFile])
    setCurrentFile(newFile)
    setLanguage(fileType)
    setCode(newFile.content)
    setShowCreateFileModal(false)
    setNewFileName('')
  }

  const createNewFolder = () => {
    setShowCreateFolderModal(true)
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    
    const newFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName,
      parent: null
    }
    
    setFolders(prevFolders => [...prevFolders, newFolder])
    setShowCreateFolderModal(false)
    setNewFolderName('')
    
    // Auto expand newly created folders
    setExpandedFolders(prev => ({
      ...prev,
      [newFolder.id]: true
    }))
  }

  const deleteItem = (item, itemType) => {
    if (itemType === 'file') {
      // If deleting the current file, clear the editor
      if (currentFile && item.id === currentFile.id) {
        setCurrentFile(null)
        setCode('')
      }
      
      setFiles(prevFiles => prevFiles.filter(file => file.id !== item.id))
    } else {
      // Delete folder and all its contents recursively
      const folderToDelete = item.id
      
      // Delete all files in this folder
      setFiles(prevFiles => prevFiles.filter(file => file.parent !== folderToDelete))
      
      // Delete all subfolders recursively
      const deleteSubfolders = (parentId) => {
        const subfolders = folders.filter(f => f.parent === parentId).map(f => f.id)
        
        if (subfolders.length > 0) {
          subfolders.forEach(subfolderId => {
            deleteSubfolders(subfolderId)
          })
        }
        
        setFolders(prevFolders => prevFolders.filter(folder => folder.parent !== parentId && folder.id !== parentId))
      }
      
      deleteSubfolders(folderToDelete)
    }
  }

  const renameItem = (item, itemType) => {
    setItemToRename({ item, type: itemType })
    setNewItemName(item.name)
    setShowRenameModal(true)
  }

  const handleRenameItem = () => {
    if (!newItemName.trim() || !itemToRename) return
    
    if (itemToRename.type === 'file') {
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === itemToRename.item.id ? { ...file, name: newItemName } : file
        )
      )
      
      // Update current file if it's the one being renamed
      if (currentFile && currentFile.id === itemToRename.item.id) {
        setCurrentFile({ ...currentFile, name: newItemName })
      }
    } else {
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === itemToRename.item.id ? { ...folder, name: newItemName } : folder
        )
      )
    }
    
    setShowRenameModal(false)
    setItemToRename(null)
    setNewItemName('')
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }))
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
      return;
    }
    
    setIsAIProcessing(true);
    
    try {
      const response = await fetch(`${API_CONFIG.LOCAL_API_URL}/ai/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          language, 
          prompt: aiPrompt,
          session_id: aiSessionId // Include the session ID if we have one
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if the response contains an error flag
      if (data.error) {
        // Handle API key error specifically
        if (data.explanation && data.explanation.includes("API Key")) {
          setAIExplanation(`The AI service is not properly configured. The administrator needs to set up a valid API key. Please try again later.`);
        } else {
          // For other errors
          setAIExplanation(data.explanation || `There was an error processing your request. Please try again later.`);
        }
        // Don't update code if there was an error
        return;
      }
      
      // Save the session ID for future requests
      if (data.session_id) {
        setAISessionId(data.session_id);
      }
      
      // Update the AI conversation history
      setAIConversationHistory(prev => [
        ...prev,
        {
          type: 'user',
          content: aiPrompt,
          timestamp: new Date().toISOString()
        },
        {
          type: 'ai',
          content: data.explanation,
          code: data.updated_code,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Update the code editor
      setCode(data.updated_code);
      if (currentFile) {
        setFiles(prevFiles => 
          prevFiles.map(file => 
            file.id === currentFile.id ? {...file, content: data.updated_code} : file
          )
        );
      }
      
      setAIExplanation(data.explanation);
      setAIPrompt(''); // Clear the prompt field after successful processing
    } catch (error) {
      console.error('AI processing error:', error);
      
      // Check for specific error patterns
      if (error.message && error.message.includes("401")) {
        setAIExplanation(`AI service configuration error: The API key is invalid or not set up correctly. This is an administrator issue - please contact the site admin.`);
      } else if (error.message && error.message.includes("Failed to fetch")) {
        setAIExplanation(`Unable to connect to the AI service. Please check your internet connection or try again later.`);
      } else {
        setAIExplanation(`Error: ${error.message}. Please try again later.`);
      }
    } finally {
      setIsAIProcessing(false);
    }
  };

  const renderConversationHistory = () => {
    if (aiConversationHistory.length === 0) return null
    
    return (
      <div className="ai-conversation-history">
        <h3>Conversation History</h3>
        {aiConversationHistory.map((item, index) => (
          <div key={index} className="conversation-item">
            <div className="prompt">
              <strong>You:</strong> {item.prompt}
            </div>
            <div className="response">
              <strong>AI:</strong> <span className="explanation">{item.explanation.slice(0, 100)}...</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Click outside handler for modals
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiModalRef.current && !aiModalRef.current.contains(event.target) && showAIModal) {
        closeAIModal()
      }
      
      if (createModalRef.current && !createModalRef.current.contains(event.target) && showCreateFileModal) {
        setShowCreateFileModal(false)
        setNewFileName('')
      }
      
      if (createFolderModalRef.current && !createFolderModalRef.current.contains(event.target) && showCreateFolderModal) {
        setShowCreateFolderModal(false)
        setNewFolderName('')
      }
      
      if (renameModalRef.current && !renameModalRef.current.contains(event.target) && showRenameModal) {
        setShowRenameModal(false)
        setItemToRename(null)
        setNewItemName('')
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAIModal, showCreateFileModal, showCreateFolderModal, showRenameModal])

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
      // Check if this is a language that should be executed externally
      if (ExternalCompilerService.needsExternalExecution(language)) {
        // Use external service for Python, Java, C and C++
        const result = await ExternalCompilerService.executeCode(code, language);
        setOutput(result.result || 'No output received.');
        if (result.error) {
          setOutput(prev => `${prev}\n\nError: ${result.error}`);
        }
        return;
      }
      
      // For JavaScript and other languages, continue using local backend
      const response = await fetch(`${API_CONFIG.LOCAL_API_URL}/execute`, {
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
            <div class="box" style="margin-top: 20px; padding: 15px; border: 1px solid #ccc;">
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
    if (currentFile) {
      return currentFile.name
    }
    
    switch (language) {
      case 'javascript': return 'script.js'
      case 'python': return 'main.py'
      case 'java': return 'Main.java'
      case 'cpp': return 'main.cpp'
      case 'c': return 'main.c'
      case 'html': return 'index.html'
      case 'css': return 'styles.css'
      default: return 'file.txt'
    }
  }

  // Get icon for file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    return languageIcons[extension] || languageIcons.default
  }

  // Get active sidebar view
  const getSidebarView = () => {
    switch (activeSidebarItem) {
      case 'explorer':
        return (
          <>
            <div className="sidebar-actions">
              <button 
                className="sidebar-action-button" 
                onClick={createNewFile}
                title="New File"
              >
                📄+
              </button>
              <button 
                className="sidebar-action-button" 
                onClick={createNewFolder}
                title="New Folder"
              >
                📁+
              </button>
              <button 
                className="sidebar-action-button" 
                onClick={() => {
                  // Refresh file list (for a real app this would reload from storage)
                  const timestamp = Date.now()
                  setFiles(prev => [...prev])
                  setFolders(prev => [...prev])
                }}
                title="Refresh Explorer"
              >
                🔄
              </button>
            </div>
            <div className="file-explorer">
              {/* Root Files */}
              {files.filter(file => file.parent === null).map(file => (
                <div 
                  key={file.id}
                  className={`file-item ${currentFile && currentFile.id === file.id ? 'active' : ''}`}
                  onClick={() => openFile(file)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    // Show context menu for right-click
                    // In a production app, this would open a proper context menu
                    const action = window.confirm(`Choose an action for ${file.name}:\nOK = Rename, Cancel = Delete`)
                    if (action) {
                      renameItem(file, 'file')
                    } else {
                      if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
                        deleteItem(file, 'file')
                      }
                    }
                  }}
                >
                  <span className="file-icon">{getFileIcon(file.name)}</span>
                  <span className="file-name">{file.name}</span>
                </div>
              ))}
              
              {/* Root Folders */}
              {folders.filter(folder => folder.parent === null).map(folder => (
                <div key={folder.id} className="folder-container">
                  <div 
                    className="folder-item"
                    onClick={() => toggleFolder(folder.id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      // Show context menu for right-click
                      const action = window.confirm(`Choose an action for ${folder.name}:\nOK = Rename, Cancel = Delete`)
                      if (action) {
                        renameItem(folder, 'folder')
                      } else {
                        if (window.confirm(`Are you sure you want to delete ${folder.name} and all its contents?`)) {
                          deleteItem(folder, 'folder')
                        }
                      }
                    }}
                  >
                    <span className="folder-icon">
                      {expandedFolders[folder.id] ? '📂' : '📁'}
                    </span>
                    <span className="folder-name">{folder.name}</span>
                  </div>
                  
                  {/* Folder contents */}
                  {expandedFolders[folder.id] && (
                    <div className="folder-contents">
                      {/* Subfolders */}
                      {folders.filter(subFolder => subFolder.parent === folder.id).map(subFolder => (
                        <div key={subFolder.id} className="folder-container">
                          <div 
                            className="folder-item"
                            onClick={() => toggleFolder(subFolder.id)}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              // Show context menu for right-click
                              const action = window.confirm(`Choose an action for ${subFolder.name}:\nOK = Rename, Cancel = Delete`)
                              if (action) {
                                renameItem(subFolder, 'folder')
                              } else {
                                if (window.confirm(`Are you sure you want to delete ${subFolder.name} and all its contents?`)) {
                                  deleteItem(subFolder, 'folder')
                                }
                              }
                            }}
                          >
                            <span className="folder-icon">
                              {expandedFolders[subFolder.id] ? '📂' : '📁'}
                            </span>
                            <span className="folder-name">{subFolder.name}</span>
                          </div>
                          
                          {/* Subfolder contents */}
                          {expandedFolders[subFolder.id] && (
                            <div className="folder-contents">
                              {files.filter(file => file.parent === subFolder.id).map(file => (
                                <div 
                                  key={file.id}
                                  className={`file-item ${currentFile && currentFile.id === file.id ? 'active' : ''}`}
                                  onClick={() => openFile(file)}
                                  onContextMenu={(e) => {
                                    e.preventDefault()
                                    const action = window.confirm(`Choose an action for ${file.name}:\nOK = Rename, Cancel = Delete`)
                                    if (action) {
                                      renameItem(file, 'file')
                                    } else {
                                      if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
                                        deleteItem(file, 'file')
                                      }
                                    }
                                  }}
                                >
                                  <span className="file-icon">{getFileIcon(file.name)}</span>
                                  <span className="file-name">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Files in folder */}
                      {files.filter(file => file.parent === folder.id).map(file => (
                        <div 
                          key={file.id}
                          className={`file-item ${currentFile && currentFile.id === file.id ? 'active' : ''}`}
                          onClick={() => openFile(file)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            const action = window.confirm(`Choose an action for ${file.name}:\nOK = Rename, Cancel = Delete`)
                            if (action) {
                              renameItem(file, 'file')
                            } else {
                              if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
                                deleteItem(file, 'file')
                              }
                            }
                          }}
                        >
                          <span className="file-icon">{getFileIcon(file.name)}</span>
                          <span className="file-name">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      
      case 'search':
        return (
          <div className="search-view">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search in workspace..." 
            />
            <div className="search-results">
              <div className="search-placeholder">Enter a search term</div>
            </div>
          </div>
        );
        
      case 'git':
        return (
          <div className="git-view">
            <div className="git-placeholder">
              <p>Git functionality would be here</p>
              <button className="sidebar-button">Initialize Repository</button>
            </div>
          </div>
        );
        
      case 'debug':
        return (
          <div className="debug-view">
            <div className="debug-placeholder">
              <p>Debug controls</p>
              <button className="sidebar-button" onClick={runCode} disabled={isLoading}>
                {isLoading ? '⏳ Running...' : '▶ Run Code'}
              </button>
            </div>
          </div>
        );
        
      case 'extensions':
        return (
          <div className="extensions-view">
            <div className="extensions-placeholder">
              <p>Extensions would be listed here</p>
              <button className="sidebar-button">Install Extensions</button>
            </div>
          </div>
        );
        
      default:
        return null;
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
        {/* Activity Bar */}
        <div className="activity-bar">
          <div 
            className={`activity-bar-item ${activeSidebarItem === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveSidebarItem('explorer')}
            title="Explorer"
          >
            📁
          </div>
          <div 
            className={`activity-bar-item ${activeSidebarItem === 'search' ? 'active' : ''}`}
            onClick={() => setActiveSidebarItem('search')}
            title="Search"
          >
            🔍
          </div>
          <div 
            className={`activity-bar-item ${activeSidebarItem === 'git' ? 'active' : ''}`}
            onClick={() => setActiveSidebarItem('git')}
            title="Source Control"
          >
            📊
          </div>
          <div 
            className={`activity-bar-item ${activeSidebarItem === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveSidebarItem('debug')}
            title="Run and Debug"
          >
            🐞
          </div>
          <div 
            className={`activity-bar-item ${activeSidebarItem === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveSidebarItem('extensions')}
            title="Extensions"
          >
            🧩
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`editor-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-header">
            <span>{activeSidebarItem.toUpperCase()}</span>
            <button className="sidebar-toggle" onClick={toggleSidebar}>×</button>
          </div>
          
          <div className="sidebar-content">
            {getSidebarView()}
          </div>
        </aside>

        {/* Editor content */}
        <main className="editor-content">
          <div className="editor-tabs">
            {currentFile ? (
              <div className="editor-tab active">
                <span className="language-icon">{getFileIcon(currentFile.name)}</span>
                <span className="tab-name">{currentFile.name}</span>
                <span className="tab-close" onClick={() => {
                  // Close tab but don't delete the file
                  setCurrentFile(null)
                  setCode('')
                  clearOutput()
                }}>×</span>
              </div>
            ) : (
              <div className="editor-tab active">
                <span className="language-icon">{languageIcons[language]}</span>
                <span className="tab-name">{getFileName()}</span>
              </div>
            )}
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
            {currentFile ? getFileIcon(currentFile.name) : languageIcons[language]} 
            {currentFile ? currentFile.name : language.charAt(0).toUpperCase() + language.slice(1)}
          </div>
        </div>
        <div class="status-right">
          <div class="status-item">
            <select value={theme} onChange={handleThemeChange}>
              <option value="vs-dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </footer>

      {/* Create File Modal */}
      {showCreateFileModal && (
        <div className="modal-overlay">
          <div className="modal" ref={createModalRef}>
            <div className="modal-header">
              <h2>Create New File</h2>
            </div>
            <div className="modal-content">
              <label htmlFor="new-file-name">File Name:</label>
              <input
                id="new-file-name"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. file.js, index.html"
                autoFocus
              />
              <p className="modal-hint">Include file extension (.js, .py, .html, etc.)</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowCreateFileModal(false)
                  setNewFileName('')
                }}
                className="toolbar-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFile}
                className="toolbar-button primary"
                disabled={!newFileName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal-overlay">
          <div className="modal" ref={createFolderModalRef}>
            <div className="modal-header">
              <h2>Create New Folder</h2>
            </div>
            <div className="modal-content">
              <label htmlFor="new-folder-name">Folder Name:</label>
              <input
                id="new-folder-name"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. src, assets, utils"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                }}
                className="toolbar-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                className="toolbar-button primary"
                disabled={!newFolderName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && itemToRename && (
        <div className="modal-overlay">
          <div className="modal" ref={renameModalRef}>
            <div className="modal-header">
              <h2>Rename {itemToRename.type === 'file' ? 'File' : 'Folder'}</h2>
            </div>
            <div className="modal-content">
              <label htmlFor="new-item-name">New Name:</label>
              <input
                id="new-item-name"
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowRenameModal(false)
                  setItemToRename(null)
                  setNewItemName('')
                }}
                className="toolbar-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleRenameItem}
                className="toolbar-button primary"
                disabled={!newItemName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="ai-modal" ref={aiModalRef}>
            <div className="modal-header">
              <span>🤖</span>
              <h2>AI Code Assistant</h2>
            </div>
            
            {/* Conversation History */}
            {aiConversationHistory.length > 0 && (
              <div className="ai-conversation-history">
                <h3>Conversation History</h3>
                {aiConversationHistory.map((entry, index) => (
                  <div key={index} className={`conversation-entry ${entry.type}`}>
                    <div className="conversation-header">
                      <strong>{entry.type === 'user' ? '👤 You' : '🤖 AI'}</strong>
                      <span className="conversation-time">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="conversation-content">
                      {entry.type === 'user' ? (
                        <p>{entry.content}</p>
                      ) : (
                        <p>{entry.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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
              {aiSessionId && (
                <button 
                  onClick={() => {
                    // Clear the session
                    setAISessionId(null);
                    setAIConversationHistory([]);
                    setAIExplanation('');
                  }}
                  className="toolbar-button secondary"
                  disabled={isAIProcessing}
                >
                  New Session
                </button>
              )}
              <button 
                onClick={closeAIModal}
                className="toolbar-button"
                disabled={isAIProcessing}
              >
                Close
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
