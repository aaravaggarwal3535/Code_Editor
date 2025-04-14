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
  const [linkedFiles, setLinkedFiles] = useState({});  // Track linked HTML-CSS files
  
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
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>',
    css: `/* Basic CSS styling */
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  color: #333;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

p {
  line-height: 1.6;
  margin-bottom: 15px;
}

.box {
  background-color: #3498db;
  color: white;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  margin: 20px 0;
}

button {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: #27ae60;
}`,
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}',
  }

  const languageIcons = {
    javascript: '📜',
    python: '🐍',
    java: '☕',
    cpp: '⚙️',
    html: '🌐',
    css: '🎨',
    txt: '📄',
    md: '📝',
    json: '📊',
    c: '🔧',
    default: '📄'
  }

  // Get file type from file extension
  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Map common extensions to language types
    const extensionMap = {
      // JavaScript and related
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      
      // Web
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      
      // C-family
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      
      // Python
      'py': 'python',
      'pyw': 'python',
      
      // Java
      'java': 'java',
      
      // Other common types
      'json': 'json',
      'md': 'markdown',
      'txt': 'plaintext',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'bat': 'bat'
    };
    
    return extensionMap[extension] || 'plaintext';
  };

  // Initialize files and folders
  useEffect(() => {
    // Sample initial file structure with linked HTML and CSS
    setFiles([
      { id: '1', name: 'script.js', type: 'javascript', content: starterCode.javascript, parent: null },
      { id: '2', name: 'main.py', type: 'python', content: starterCode.python, parent: null },
      { id: '3', name: 'styles.css', type: 'css', content: starterCode.css, parent: null },
      { id: '4', name: 'index.html', type: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n    <h1>Hello, world!</h1>\n    <p>This content will be styled by the linked CSS file.</p>\n    <div class="box">This is a styled box</div>\n</body>\n</html>', parent: null },
      { id: '5', name: 'config.json', type: 'json', content: '{\n  "name": "My Project",\n  "version": "1.0.0"\n}', parent: 'folder1' },
      { id: '6', name: 'README.md', type: 'md', content: '# My Project\n\nThis is a sample project.', parent: null },
      { id: '7', name: 'utils.js', type: 'javascript', content: '// Utility functions\nfunction formatDate(date) {\n  return date.toLocaleDateString();\n}\n\nfunction formatTime(date) {\n  return date.toLocaleTimeString();\n}', parent: 'folder2' },
      { id: '8', name: 'hello.c', type: 'c', content: starterCode.c, parent: null }
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

  // Find potential linked files (HTML-CSS integration)
  useEffect(() => {
    // Build a map of file relationships
    const newLinkedFiles = {};
    
    // Link HTML files with CSS files
    const htmlFiles = files.filter(file => file.type === 'html');
    const cssFiles = files.filter(file => file.type === 'css');
    
    htmlFiles.forEach(htmlFile => {
      // Look for CSS link tags in HTML content
      const cssLinks = [];
      const regex = /<link[^>]*rel=['"]stylesheet['"][^>]*href=['"](.*?)['"][^>]*>/g;
      let match;
      
      while ((match = regex.exec(htmlFile.content))) {
        const href = match[1];
        // Handle relative paths
        const fileName = href.split('/').pop();
        
        // Find matching CSS file
        const matchedCss = cssFiles.find(css => css.name === fileName);
        if (matchedCss) {
          cssLinks.push(matchedCss.id);
        }
      }
      
      if (cssLinks.length > 0) {
        newLinkedFiles[htmlFile.id] = { 
          type: 'html', 
          linkedWith: cssLinks,
          linkedType: 'css'
        };
        
        // Also create the reverse relationship
        cssLinks.forEach(cssId => {
          newLinkedFiles[cssId] = { 
            type: 'css', 
            linkedWith: [htmlFile.id],
            linkedType: 'html'
          };
        });
      }
    });
    
    setLinkedFiles(newLinkedFiles);
  }, [files]);
  
  // Update linked files when file content changes
  useEffect(() => {
    if (currentFile && currentFile.type === 'html') {
      // Check for new CSS links when HTML content changes
      const cssLinks = [];
      const regex = /<link[^>]*rel=['"]stylesheet['"][^>]*href=['"](.*?)['"][^>]*>/g;
      let match;
      
      while ((match = regex.exec(code))) {
        const href = match[1];
        const fileName = href.split('/').pop();
        
        // Find matching CSS file
        const cssFiles = files.filter(file => file.type === 'css');
        const matchedCss = cssFiles.find(css => css.name === fileName);
        if (matchedCss) {
          cssLinks.push(matchedCss.id);
        }
      }
      
      // Update linkedFiles if there are changes
      if (cssLinks.length > 0) {
        setLinkedFiles(prev => ({
          ...prev,
          [currentFile.id]: { 
            type: 'html', 
            linkedWith: cssLinks,
            linkedType: 'css'
          }
        }));
        
        // Update reverse relationships
        cssLinks.forEach(cssId => {
          setLinkedFiles(prev => ({
            ...prev,
            [cssId]: { 
              type: 'css', 
              linkedWith: [...(prev[cssId]?.linkedWith || []), currentFile.id].filter((v, i, a) => a.indexOf(v) === i),
              linkedType: 'html'
            }
          }));
        });
      }
    }
  }, [currentFile, code, files]);

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
    // Use the file type from the file object to set the editor language
    setLanguage(file.type)
    setCode(file.content)
    clearOutput()
  }

  const createNewFile = () => {
    setShowCreateFileModal(true)
  }

  const handleCreateFile = () => {
    if (!newFileName.trim()) return
    
    // Use our new getFileType function to determine the file type
    const fileType = getFileType(newFileName)
    
    // Prepare starter content based on file type
    let fileContent = ''
    if (starterCode[fileType]) {
      fileContent = starterCode[fileType]
    } else {
      // Default content for unsupported file types
      fileContent = `// New ${fileType} file: ${newFileName}`
    }
    
    const newFile = {
      id: `file_${Date.now()}`,
      name: newFileName,
      type: fileType,
      content: fileContent,
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
      const response = await fetch('http://localhost:8001/ai/improve', {
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
      setAIExplanation(`Error: ${error.message}`);
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
    
    // Check if this HTML file has linked CSS files
    const htmlFileId = currentFile?.id;
    if (htmlFileId && linkedFiles[htmlFileId]?.type === 'html') {
      // This HTML file has linked CSS files, get their content
      const cssFilesIds = linkedFiles[htmlFileId].linkedWith;
      const cssContent = cssFilesIds.map(cssId => {
        const cssFile = files.find(f => f.id === cssId);
        return cssFile ? cssFile.content : '';
      }).join('\n');
      
      // Insert the CSS content into the HTML
      // Look for </head> tag
      let enhancedHtml = htmlCode;
      if (htmlCode.includes('</head>')) {
        enhancedHtml = htmlCode.replace('</head>', `<style id="integrated-css">
${cssContent}
</style>
</head>`);
      } else if (!htmlCode.includes('<head>')) {
        // If no head tag exists, add one
        enhancedHtml = `<!DOCTYPE html>
<html>
<head>
<style id="integrated-css">
${cssContent}
</style>
</head>
${htmlCode}
</html>`;
      }
      
      // Render the enhanced HTML
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      previewRef.current.innerHTML = '';
      previewRef.current.appendChild(iframe);
      
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      iframeDocument.open();
      iframeDocument.write(enhancedHtml);
      iframeDocument.close();
      
      // Log that we're showing integrated preview
      console.log(`Rendering HTML with ${cssFilesIds.length} linked CSS files`);
      return;
    }
    
    // Regular HTML preview without CSS integration
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    previewRef.current.innerHTML = '';
    previewRef.current.appendChild(iframe);
    
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(htmlCode);
    iframeDocument.close();
  }

  const renderCSSPreview = (cssCode) => {
    if (!previewRef.current) return
    
    // Check if this CSS file is linked to any HTML files
    const cssFileId = currentFile?.id;
    
    if (cssFileId && linkedFiles[cssFileId]?.type === 'css') {
      // This CSS file is linked to HTML files, render with the HTML
      const htmlFilesIds = linkedFiles[cssFileId].linkedWith;
      if (htmlFilesIds.length > 0) {
        // Use the first linked HTML file
        const htmlFile = files.find(f => f.id === htmlFilesIds[0]);
        if (htmlFile) {
          // Create a modified HTML with the current CSS embedded
          let htmlContent = htmlFile.content;
          
          // Insert the current CSS content
          if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `<style id="integrated-css">
${cssCode}
</style>
</head>`);
          } else if (!htmlContent.includes('<head>')) {
            // If no head tag exists, add one
            htmlContent = `<!DOCTYPE html>
<html>
<head>
<style id="integrated-css">
${cssCode}
</style>
</head>
${htmlContent}
</html>`;
          }
          
          // Render the enhanced HTML
          const iframe = document.createElement('iframe');
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          
          previewRef.current.innerHTML = '';
          previewRef.current.appendChild(iframe);
          
          const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
          iframeDocument.open();
          iframeDocument.write(htmlContent);
          iframeDocument.close();
          
          // Show a message to indicate this is a CSS preview with HTML
          setOutput(`Previewing CSS with linked HTML file: ${htmlFile.name}`);
          return;
        }
      }
    }
    
    // Default CSS preview with sample HTML
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

  // Render the UI
  return (
    <div className={`editor-container ${theme === 'vs-dark' ? '' : 'light-theme'}`}>
      {/* Simplified Header */}
      <header className="editor-header">
        <div className="editor-title">
          <span className="editor-logo">⚡</span>
          <span>GeistCode</span>
        </div>
        <div className="editor-controls">
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-light)',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '5px 10px',
              marginRight: '10px',
              fontSize: '14px'
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
          <button onClick={toggleSidebar} className="toolbar-button">
            {isSidebarOpen ? '◀ Files' : '▶ Files'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="editor-main">
        {/* Simplified Sidebar */}
        <aside className={`editor-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-header">
            <span>Files</span>
            <button className="sidebar-toggle" onClick={toggleSidebar}>×</button>
          </div>
          
          <div className="sidebar-content">
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
                  setFiles(prev => [...prev])
                  setFolders(prev => [...prev])
                }}
                title="Refresh"
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
                minimap: { enabled: false },
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

          {/* Simplified Toolbar */}
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
            <select 
              value={theme} 
              onChange={handleThemeChange}
              style={{
                backgroundColor: 'var(--bg-light)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '5px 10px',
                marginRight: '10px',
                fontSize: '14px'
              }}
            >
              <option value="vs-dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
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
              <h3>Console Output</h3>
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
