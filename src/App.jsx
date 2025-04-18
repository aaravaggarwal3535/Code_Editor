import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'
import ExternalCompilerService from './externalCompilerService'
import API_CONFIG from './apiConfig'
import Settings from './Settings';

// Add this near the top with other state declarations
const defaultEditorSettings = {
  fontSize: {
    label: 'Font Size',
    description: 'Controls the font size in pixels',
    type: 'number',
    default: 14,
    min: 8,
    max: 32,
    section: 'editor'
  },
  fontFamily: {
    label: 'Font Family',
    description: 'Controls the font family',
    type: 'select',
    default: 'Consolas, "Courier New", monospace',
    options: [
      { label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
      { label: 'Fira Code', value: '"Fira Code", monospace' },
      { label: 'Monaco', value: 'Monaco, monospace' },
      { label: 'Source Code Pro', value: '"Source Code Pro", monospace' }
    ],
    section: 'editor'
  },
  tabSize: {
    label: 'Tab Size',
    description: 'Controls the number of spaces a tab is equal to',
    type: 'number',
    default: 2,
    min: 1,
    max: 8,
    section: 'editor'
  },
  minimap: {
    label: 'Show Minimap',
    description: 'Controls if the minimap is shown',
    type: 'checkbox',
    default: true,
    section: 'editor'
  },
  wordWrap: {
    label: 'Word Wrap',
    description: 'Controls how lines should wrap',
    type: 'select',
    default: 'off',
    options: [
      { label: 'Off', value: 'off' },
      { label: 'On', value: 'on' },
      { label: 'Word Wrap', value: 'wordWrapColumn' },
      { label: 'Bounded', value: 'bounded' }
    ],
    section: 'editor'
  },
  lineNumbers: {
    label: 'Line Numbers',
    description: 'Controls the display of line numbers',
    type: 'select',
    default: 'on',
    options: [
      { label: 'Off', value: 'off' },
      { label: 'On', value: 'on' },
      { label: 'Relative', value: 'relative' }
    ],
    section: 'editor'
  },
  cursorStyle: {
    label: 'Cursor Style',
    description: 'Controls the cursor style',
    type: 'select',
    default: 'line',
    options: [
      { label: 'Line', value: 'line' },
      { label: 'Block', value: 'block' },
      { label: 'Underline', value: 'underline' }
    ],
    section: 'editor'
  },
  cursorBlinking: {
    label: 'Cursor Blinking',
    description: 'Controls the cursor animation style',
    type: 'select',
    default: 'blink',
    options: [
      { label: 'Blink', value: 'blink' },
      { label: 'Smooth', value: 'smooth' },
      { label: 'Phase', value: 'phase' },
      { label: 'Expand', value: 'expand' },
      { label: 'Solid', value: 'solid' }
    ],
    section: 'editor'
  },
  scrollBeyondLastLine: {
    label: 'Scroll Beyond Last Line',
    description: 'Controls if the editor scrolls beyond the last line',
    type: 'checkbox',
    default: true,
    section: 'editor'
  },
  formatOnPaste: {
    label: 'Format On Paste',
    description: 'Format content when pasting into the editor',
    type: 'checkbox',
    default: true,
    section: 'editor'
  },
  formatOnType: {
    label: 'Format On Type',
    description: 'Format content as you type in the editor',
    type: 'checkbox',
    default: false,
    section: 'editor'
  },
  autoSave: {
    label: 'Auto Save',
    description: 'Controls auto save of the editor content',
    type: 'select',
    default: 'off',
    options: [
      { label: 'Off', value: 'off' },
      { label: 'After Delay', value: 'afterDelay' },
      { label: 'On Focus Change', value: 'onFocusChange' }
    ],
    section: 'features'
  },
  theme: {
    label: 'Color Theme',
    description: 'Controls the color theme of the editor',
    type: 'select',
    default: 'vs-dark',
    options: [
      { label: 'Dark', value: 'vs-dark' },
      { label: 'Light', value: 'vs-light' }
    ],
    section: 'workbench'
  }
};

function App() {
  // Core state
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello, world!");')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('vs-dark')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Terminal state
  const [terminalVisible, setTerminalVisible] = useState(false)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState([])
  const terminalInputRef = useRef(null)
  const [isWaitingForInput, setIsWaitingForInput] = useState(false)
  const [runningProcess, setRunningProcess] = useState(null)
  
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

  // Add this state for editor settings
  const [editorSettings, setEditorSettings] = useState(() => {
    // Initialize with default values
    const settings = {};
    Object.entries(defaultEditorSettings).forEach(([key, setting]) => {
      settings[key] = setting.default;
    });
    return settings;
  });

  // Add this handler for saving settings
  const handleSaveSettings = (newSettings) => {
    setEditorSettings(newSettings);
  };

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
    // Programming Languages
    js: '⚡', // JavaScript
    jsx: '⚛️', // React JSX
    ts: '📘', // TypeScript
    tsx: '📘', // TypeScript React
    py: '🐍', // Python
    java: '☕', // Java
    cpp: '⚡', // C++
    c: '©️', // C
    cs: '🔷', // C#
    rb: '💎', // Ruby
    php: '🐘', // PHP
    go: '🔹', // Go
    rs: '⚙️', // Rust
    swift: '🔶', // Swift
    kt: '🎯', // Kotlin

    // Web Technologies
    html: '🌐', // HTML
    css: '🎨', // CSS
    scss: '💅', // SCSS
    less: '💄', // LESS
    json: '📋', // JSON
    xml: '📰', // XML
    svg: '🖼️', // SVG
    yaml: '📝', // YAML
    yml: '📝', // YML

    // Documentation
    md: '📑', // Markdown
    txt: '📄', // Text
    doc: '📘', // Word Document
    docx: '📘', // Word Document
    pdf: '📕', // PDF

    // Configuration Files
    env: '⚙️', // Environment Variables
    config: '⚙️', // Config
    ini: '⚙️', // INI Configuration
    toml: '⚙️', // TOML
    conf: '⚙️', // Conf

    // Shell Scripts
    sh: '💻', // Shell Script
    bash: '💻', // Bash Script
    zsh: '💻', // Zsh Script
    bat: '💻', // Batch Script
    ps1: '💻', // PowerShell Script

    // Data Files
    csv: '📊', // CSV
    xls: '📊', // Excel
    xlsx: '📊', // Excel
    sql: '🗃️', // SQL

    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    ico: '🖼️',
    webp: '🖼️',

    // Default
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
    const newTheme = e.target.value;
    setTheme(newTheme);
    
    // Apply Monaco editor theme correctly
    const monacoTheme = newTheme === 'light' ? 'vs-light' : 'vs-dark';
    
    // Update editor settings if needed
    if (editorSettings.theme !== monacoTheme) {
      const updatedSettings = {
        ...editorSettings,
        theme: monacoTheme
      };
      setEditorSettings(updatedSettings);
    }
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
    
    // Special case for Python files
    if (fileExt === 'py') {
      fileType = 'python'
    }
    
    // Create file with proper parent folder support
    const activeFolderId = findActiveFolderId();
    
    const newFile = {
      id: `file_${Date.now()}`,
      name: newFileName,
      type: fileType,
      content: starterCode[fileType] || '',
      parent: activeFolderId
    }
    
    setFiles(prevFiles => [...prevFiles, newFile])
    setCurrentFile(newFile)
    setLanguage(fileType)
    setCode(newFile.content)
    setShowCreateFileModal(false)
    setNewFileName('')
  }
  
  // Helper to find which folder is active when creating a new file
  const findActiveFolderId = () => {
    // Get the last clicked folder
    let activeFolderId = null;
    
    // Check if we have expanded folders - use the last one that's expanded
    const expandedFolderIds = Object.entries(expandedFolders)
      .filter(([_, isExpanded]) => isExpanded)
      .map(([id]) => id);
      
    if (expandedFolderIds.length > 0) {
      // Return the last expanded folder as the active one
      activeFolderId = expandedFolderIds[expandedFolderIds.length - 1];
    }
    
    return activeFolderId;
  }

  const createNewFolder = () => {
    setShowCreateFolderModal(true)
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    
    // Get the currently active folder to use as parent
    const activeFolderId = findActiveFolderId();
    
    const newFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName,
      parent: activeFolderId
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
    setIsLoading(true);
    
    // Make sure terminal is visible when running code
    if (!terminalVisible) {
      setTerminalVisible(true);
    }
    
    // Add a command entry in terminal history
    setTerminalHistory(prev => [...prev, { 
      type: 'command', 
      content: `run ${getFileName()}` 
    }]);

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
          const output = consoleOutput.join('\n') || 'Code executed successfully (no output)'
          
          // Add the result to terminal history
          setTerminalHistory(prev => [...prev, { 
            type: 'response', 
            content: output
          }]);
        } catch (error) {
          // Add the error to terminal history
          setTerminalHistory(prev => [...prev, { 
            type: 'error', 
            content: `Error: ${error.message}`
          }]);
        }
        
        console.log = originalConsoleLog
      } else if (language === 'html') {
        // For HTML, render preview
        renderHTMLPreview(code)
        
        // Add a message to terminal history
        setTerminalHistory(prev => [...prev, { 
          type: 'response', 
          content: 'HTML preview rendered in terminal preview pane'
        }]);
        
      } else if (language === 'css') {
        // For CSS, render with test HTML
        renderCSSPreview(code)
        
        // Add a message to terminal history
        setTerminalHistory(prev => [...prev, { 
          type: 'response', 
          content: 'CSS preview rendered in terminal preview pane'
        }]);
      } else {
        // For other languages, send to backend
        await executeOnBackend()
      }
    } catch (error) {
      console.error('Code execution error:', error)
      
      // Add the error to terminal history
      setTerminalHistory(prev => [...prev, { 
        type: 'error', 
        content: `Failed to execute code: ${error.message}`
      }]);
    } finally {
      setIsLoading(false)
      
      // Scroll terminal to bottom after execution
      setTimeout(() => {
        const terminalContainer = document.querySelector('.terminal-history');
        if (terminalContainer) {
          terminalContainer.scrollTop = terminalContainer.scrollHeight;
        }
      }, 100);
    }
  }

  // Helper function to execute code on the backend
  const executeOnBackend = async () => {
    try {
      // Check if this is a language that should be executed externally
      if (ExternalCompilerService.needsExternalExecution(language)) {
        // Use external service for Python, Java, C and C++
        const result = await ExternalCompilerService.executeCode(code, language);
        
        // Add result to terminal history instead of output panel
        if (result.result) {
          setTerminalHistory(prev => [...prev, { 
            type: 'response', 
            content: result.result 
          }]);
        } else {
          setTerminalHistory(prev => [...prev, { 
            type: 'response', 
            content: 'No output received.' 
          }]);
        }
        
        // Check if this program requires user input
        if (result.requiresInput && !result.error) {
          setIsWaitingForInput(true);
          setRunningProcess({
            language,
            code,
            sendInput: async (input) => {
              const inputResult = await ExternalCompilerService.processInput(input, language, code);
              
              // Add the result to terminal history
              if (inputResult.result) {
                setTerminalHistory(prev => [...prev, { 
                  type: 'response', 
                  content: inputResult.result 
                }]);
              }
              
              if (inputResult.error) {
                setTerminalHistory(prev => [...prev, { 
                  type: 'error', 
                  content: inputResult.error 
                }]);
              }
              
              // Check if program needs more input
              setIsWaitingForInput(inputResult.requiresMoreInput);
              if (!inputResult.requiresMoreInput) {
                setRunningProcess(null);
              }
            }
          });
          
          // Add a prompt for the user
          setTerminalHistory(prev => [...prev, { 
            type: 'response', 
            content: 'Program is waiting for input...' 
          }]);
        }
        
        if (result.error) {
          setTerminalHistory(prev => [...prev, { 
            type: 'error', 
            content: `Error: ${result.error}` 
          }]);
          
          // Clear the waiting state if there was an error
          setIsWaitingForInput(false);
          setRunningProcess(null);
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
      
      // Send results to terminal instead of output panel
      if (data.result) {
        setTerminalHistory(prev => [...prev, { 
          type: 'response', 
          content: data.result 
        }]);
      } else {
        setTerminalHistory(prev => [...prev, { 
          type: 'response', 
          content: 'No output received from the program.'
        }]);
      }
      
      if (data.error && data.error.trim() !== '') {
        setTerminalHistory(prev => [...prev, { 
          type: 'error', 
          content: `Error: ${data.error}`
        }]);
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
    if (!fileName) return languageIcons.default;
    
    // Extract extension properly, handle files without extensions
    const parts = fileName.split('.');
    const extension = parts.length > 1 ? parts.pop().toLowerCase() : 'default';
    
    // First check if we have a direct match
    if (languageIcons[extension]) {
      return languageIcons[extension];
    }
    
    // Special cases for common prefixes
    if (extension.startsWith('ts')) return languageIcons.ts;
    if (extension.startsWith('js')) return languageIcons.js;
    if (extension.startsWith('py')) return languageIcons.py;
    
    // Default fallback
    return languageIcons.default;
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
      
      case 'settings':
        return (
          <Settings 
            settings={editorSettings}
            onSave={handleSaveSettings}
            defaultSettings={defaultEditorSettings}
            theme={theme}
          />
        );
        
      default:
        return null;
    }
  }

  // Terminal functions
  const toggleTerminal = () => {
    setTerminalVisible(!terminalVisible);
    // Focus the input when terminal is opened
    setTimeout(() => {
      if (terminalInputRef.current) {
        terminalInputRef.current.focus();
      }
    }, 100);
  };

  const handleTerminalInput = (e) => {
    setTerminalInput(e.target.value);
  };

  const handleTerminalSubmit = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const input = terminalInput.trim();
      if (!input) return;
      
      // Clear input field
      setTerminalInput('');
      
      // Check if we're in input mode (waiting for input for a running program)
      if (isWaitingForInput) {
        // Add the input to history without the $ prompt
        setTerminalHistory(prev => [...prev, { 
          type: 'input', 
          content: input 
        }]);
        
        // Send the input to the running process
        if (runningProcess && runningProcess.sendInput) {
          try {
            await runningProcess.sendInput(input);
          } catch (error) {
            setTerminalHistory(prev => [...prev, { 
              type: 'error', 
              content: `Error sending input: ${error.message}` 
            }]);
            
            // Exit input mode if there was an error
            setIsWaitingForInput(false);
            setRunningProcess(null);
          }
        } else {
          // Continue with standard program execution
          setIsWaitingForInput(false);
          setRunningProcess(null);
          
          // Since we've detected input mode without a proper handler,
          // let's simulate a response from the program
          handleProgramInput(input);
        }
      } else {
        // Normal command mode
        // Add command to history with the $ prompt
        setTerminalHistory(prev => [...prev, { 
          type: 'command', 
          content: input 
        }]);
        
        try {
          // Process command
          const response = await executeTerminalCommand(input);
          
          // Add the response to history
          if (response) {
            setTerminalHistory(prev => [...prev, { 
              type: 'response', 
              content: response
            }]);
          }
        } catch (error) {
          setTerminalHistory(prev => [...prev, { 
            type: 'error', 
            content: error.message || 'An error occurred while executing the command' 
          }]);
        }
      }
      
      // Scroll to bottom after command execution
      setTimeout(() => {
        const terminalContainer = document.querySelector('.terminal-history');
        if (terminalContainer) {
          terminalContainer.scrollTop = terminalContainer.scrollHeight;
        }
      }, 100);
    }
  };

  // Handle program input when a program is running and waiting for input
  const handleProgramInput = async (input) => {
    // In a real implementation, this would communicate with the backend
    // For now, we'll simulate the program continuing execution with the input
    
    // For demonstration, detect if we're running a C++ program that needs input
    if (language === 'cpp' || language === 'c') {
      // Simple check if the code contains cin or scanf (indicating it expects input)
      if (code.includes('cin') || code.includes('scanf')) {
        // Process the input and generate appropriate output based on the code
        // This is a simplified example - in a real implementation, this would send 
        // the input to the running process on the backend
        
        // For demo purposes, let's simulate a program that processes input
        if (code.toLowerCase().includes('enter the number')) {
          try {
            const number = parseInt(input);
            if (isNaN(number)) {
              setTerminalHistory(prev => [...prev, { 
                type: 'error', 
                content: 'Invalid input: Not a number' 
              }]);
            } else {
              // Simulate program output based on input
              setTerminalHistory(prev => [...prev, { 
                type: 'response', 
                content: `Processing number: ${number}\nResult: ${number * 2}` 
              }]);
            }
          } catch (e) {
            setTerminalHistory(prev => [...prev, { 
              type: 'error', 
              content: `Error processing input: ${e.message}` 
            }]);
          }
        } else {
          // Generic response
          setTerminalHistory(prev => [...prev, { 
            type: 'response', 
            content: `Received input: ${input}` 
          }]);
        }
      }
    } else if (language === 'python') {
      // Handle Python input() function
      if (code.includes('input(')) {
        setTerminalHistory(prev => [...prev, { 
          type: 'response', 
          content: `Received input: ${input}` 
        }]);
      }
    }
    
    // Set waiting for input to false since we've processed the input
    setIsWaitingForInput(false);
  };

  // Execute terminal command (simplified demo implementation)
  const executeTerminalCommand = async (command) => {
    const lcCommand = command.toLowerCase().trim();
    
    // Simple command parsing
    if (lcCommand === 'clear' || lcCommand === 'cls') {
      setTerminalHistory([]);
      return '';
    }
    
    if (lcCommand.startsWith('echo ')) {
      return command.substring(5);
    }
    
    if (lcCommand === 'help') {
      return `Available commands:
- help: Show this help message
- clear/cls: Clear terminal
- echo <text>: Print text
- ls/dir: List files
- time: Show current time
- run: Run current code
- version: Show editor version`;
    }
    
    if (lcCommand === 'ls' || lcCommand === 'dir') {
      const fileList = files
        .filter(file => file.parent === null)
        .map(file => file.name)
        .join('\n');
      
      return fileList || 'No files found';
    }
    
    if (lcCommand === 'time') {
      return new Date().toLocaleString();
    }
    
    if (lcCommand === 'run') {
      // Run the current code
      runCode();
      return 'Running code...';
    }
    
    if (lcCommand === 'version') {
      return 'Code Editor v1.0.0';
    }
    
    // For a real implementation, you'd call backend for command execution
    return `Command not recognized: ${command}. Type 'help' for available commands.`;
  };

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
            className={`activity-bar-item ${activeSidebarItem === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSidebarItem('settings')}
            title="Settings"
          >
            ⚙️
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
                minimap: { enabled: editorSettings.minimap },
                fontSize: editorSettings.fontSize,
                fontFamily: editorSettings.fontFamily,
                tabSize: editorSettings.tabSize,
                wordWrap: editorSettings.wordWrap,
                lineNumbers: editorSettings.lineNumbers,
                scrollBeyondLastLine: editorSettings.scrollBeyondLastLine,
                cursorStyle: editorSettings.cursorStyle,
                cursorBlinking: editorSettings.cursorBlinking,
                formatOnPaste: editorSettings.formatOnPaste,
                formatOnType: editorSettings.formatOnType,
                automaticLayout: true,
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto'
                },
                cursorWidth: 2, // Increase cursor width for better visibility
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
            <button 
              onClick={toggleTerminal} 
              className="toolbar-button"
              title="Toggle terminal"
            >
              💻 Terminal
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

          {/* Terminal panel */}
          {terminalVisible && (
            <div className="terminal-container">
              <div className="terminal-header">
                <span className="terminal-title">Terminal</span>
                <div className="terminal-controls">
                  <button className="terminal-control" onClick={() => setTerminalHistory([])} title="Clear terminal">
                    🧹
                  </button>
                  <button className="terminal-control" onClick={toggleTerminal} title="Close terminal">
                    ✕
                  </button>
                </div>
              </div>
              <div className="terminal-history">
                {terminalHistory.map((entry, index) => (
                  <div key={index} className={`terminal-${entry.type}`}>
                    {entry.type === 'command' ? (
                      <>
                        <span className="terminal-command-prompt">$ </span>
                        <span>{entry.content}</span>
                      </>
                    ) : (
                      <span>{entry.content}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="terminal-input-container">
                <span className="terminal-prompt">$ </span>
                <input
                  type="text"
                  className="terminal-input"
                  value={terminalInput}
                  onChange={handleTerminalInput}
                  onKeyDown={handleTerminalSubmit}
                  placeholder="Enter a command..."
                  ref={terminalInputRef}
                  autoFocus
                />
              </div>
            </div>
          )}
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
