import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import './App.css'

// VS Code-like icons for activity bar
const ActivityBarIcon = ({ icon, active, title, onClick }) => (
  <div 
    className={`activity-bar-icon ${active ? 'active' : ''}`} 
    title={title}
    onClick={onClick}
  >
    {icon}
  </div>
);

// Tab component for editor tabs
const EditorTab = ({ file, active, onSelect, onClose }) => (
  <div className={`editor-tab ${active ? 'active' : ''}`} onClick={onSelect}>
    <span className="tab-icon">
      {file.name.endsWith('.jsx') || file.name.endsWith('.js') ? '📄' : 
       file.name.endsWith('.css') ? '🎨' : 
       file.name.endsWith('.html') ? '🌐' : 
       file.name.endsWith('.py') ? '🐍' : 
       file.name.endsWith('.java') ? '☕' : 
       file.name.endsWith('.cpp') ? '⚡' : '📄'}
    </span>
    <span className="tab-name">{file.name}</span>
    <span className="tab-close" onClick={(e) => { e.stopPropagation(); onClose(file); }}>×</span>
  </div>
);

// Settings component for the settings view
const SettingsComponent = ({ settings, onSave, defaultSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('editor');
  const [localSettings, setLocalSettings] = useState({...settings});
  const [previewCode, setPreviewCode] = useState('// This is a preview of your editor settings\n\nfunction helloWorld() {\n  console.log("Hello, world!");\n  \n  // Your settings are applied here\n  const x = 42;\n  if (x > 0) {\n    return true;\n  }\n  \n  return false;\n}');

  // Handle setting change
  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Save settings when they change
  useEffect(() => {
    onSave(localSettings);
  }, [localSettings, onSave]);
  
  // Reset settings to defaults
  const handleReset = (section) => {
    const keysToReset = Object.keys(defaultSettings).filter(key => 
      defaultSettings[key].section === section || section === 'all'
    );
    
    const resetValues = {};
    keysToReset.forEach(key => {
      resetValues[key] = defaultSettings[key].default;
    });

    setLocalSettings(prev => ({
      ...prev,
      ...resetValues
    }));
  };
  
  // Get the list of settings based on the active section and search query
  const getFilteredSettings = () => {
    return Object.keys(defaultSettings).filter(key => {
      const setting = defaultSettings[key];
      const matchesSection = activeSection === 'all' || setting.section === activeSection;
      const matchesSearch = !searchQuery || 
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (setting.description && setting.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
      return matchesSection && matchesSearch;
    });
  };

  // Group settings by category for better organization
  const getGroupedSettings = () => {
    const filtered = getFilteredSettings();
    const grouped = {};
    
    filtered.forEach(key => {
      const category = defaultSettings[key].category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(key);
    });
    
    return grouped;
  };
  
  // Render setting input based on type
  const renderSettingInput = (key) => {
    const setting = defaultSettings[key];
    const value = localSettings[key];
    
    switch (setting.type) {
      case 'select':
        return (
          <select 
            value={value} 
            onChange={(e) => handleSettingChange(key, e.target.value)}
            aria-label={setting.label}
          >
            {setting.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
          <input 
            type="checkbox" 
            checked={value} 
            onChange={(e) => handleSettingChange(key, e.target.checked)}
            aria-label={setting.label}
          />
        );
        
      case 'number':
        return (
          <input 
            type="number" 
            value={value} 
            min={setting.min} 
            max={setting.max} 
            step={setting.step || 1}
            onChange={(e) => handleSettingChange(key, Number(e.target.value))}
            aria-label={setting.label}
          />
        );
        
      case 'color':
        return (
          <input 
            type="color" 
            value={value} 
            onChange={(e) => handleSettingChange(key, e.target.value)}
            aria-label={setting.label}
          />
        );
        
      default:
        return (
          <input 
            type="text" 
            value={value} 
            onChange={(e) => handleSettingChange(key, e.target.value)}
            aria-label={setting.label}
          />
        );
    }
  };
  
  return (
    <div className="settings-view">
      <div className="settings-container">
        {/* Settings sidebar */}
        <div className="settings-sidebar">
          <div className="search-settings">
            <input 
              type="text" 
              placeholder="Search settings" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search settings"
            />
          </div>
          
          <div 
            className={`settings-sidebar-item ${activeSection === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSection('all')}
          >
            All Settings
          </div>
          <div 
            className={`settings-sidebar-item ${activeSection === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveSection('editor')}
          >
            <span>🖊️</span> Text Editor
          </div>
          <div 
            className={`settings-sidebar-item ${activeSection === 'workbench' ? 'active' : ''}`}
            onClick={() => setActiveSection('workbench')}
          >
            <span>🖥️</span> Workbench
          </div>
          <div 
            className={`settings-sidebar-item ${activeSection === 'features' ? 'active' : ''}`}
            onClick={() => setActiveSection('features')}
          >
            <span>🔧</span> Features
          </div>
          <div 
            className={`settings-sidebar-item ${activeSection === 'application' ? 'active' : ''}`}
            onClick={() => setActiveSection('application')}
          >
            <span>⚙️</span> Application
          </div>
        </div>
        
        {/* Settings main content */}
        <div className="settings-main">
          <div className="settings-header">
            <h2>{activeSection === 'all' ? 'All Settings' : 
              activeSection === 'editor' ? 'Text Editor Settings' :
              activeSection === 'workbench' ? 'Workbench Settings' :
              activeSection === 'features' ? 'Features Settings' :
              'Application Settings'}
            </h2>
            <button 
              className="reset-button" 
              onClick={() => handleReset(activeSection)}
              aria-label={`Reset ${activeSection} settings to default`}
            >
              Reset to Default
            </button>
          </div>
          
          {/* Editor preview for editor settings */}
          {activeSection === 'editor' && (
            <div className="editor-preview">
              <Editor
                height="100%"
                width="100%"
                language="javascript"
                theme={localSettings.theme}
                value={previewCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: localSettings.minimap },
                  fontSize: localSettings.fontSize,
                  tabSize: localSettings.tabSize,
                  fontFamily: localSettings.fontFamily,
                  wordWrap: localSettings.wordWrap,
                  lineNumbers: localSettings.lineNumbers,
                  scrollBeyondLastLine: localSettings.scrollBeyondLastLine,
                  cursorBlinking: localSettings.cursorBlinking,
                  formatOnPaste: localSettings.formatOnPaste,
                  formatOnType: localSettings.formatOnType,
                }}
              />
            </div>
          )}
          
          {/* Render settings grouped by category */}
          {Object.entries(getGroupedSettings()).map(([category, keys]) => (
            <div className="settings-section" key={category}>
              <h3 className="settings-group-title">{category}</h3>
              {keys.map(key => (
                <div className="setting-item" key={key}>
                  <div className="setting-item-header">
                    <div>
                      <div className="setting-item-label">{defaultSettings[key].label}</div>
                      {defaultSettings[key].description && (
                        <div className="setting-item-description">{defaultSettings[key].description}</div>
                      )}
                    </div>
                    <button 
                      className="reset-button" 
                      onClick={() => handleSettingChange(key, defaultSettings[key].default)}
                      aria-label={`Reset ${defaultSettings[key].label} to default`}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="setting-item-input">
                    {renderSettingInput(key)}
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {/* Show message if no settings match search */}
          {Object.keys(getGroupedSettings()).length === 0 && (
            <div className="no-settings-found">
              No settings found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate()
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello, world!");')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('vs-dark')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState('explorer') // explorer, search, git, debug, extensions, settings
  const [openFiles, setOpenFiles] = useState([]) // Array of open files
  const [activeFile, setActiveFile] = useState(null) // Currently active file
  const [panelVisible, setPanelVisible] = useState(true) // Control panel visibility
  
  // Define default editor settings
  const defaultEditorSettings = {
    // Editor settings
    theme: {
      label: 'Theme',
      description: 'Specifies the color theme used in the editor',
      type: 'select',
      options: [
        { label: 'Dark', value: 'vs-dark' },
        { label: 'Light', value: 'light' },
        { label: 'High Contrast Dark', value: 'hc-black' },
        { label: 'High Contrast Light', value: 'hc-light' }
      ],
      default: 'vs-dark',
      section: 'editor',
      category: 'Appearance'
    },
    fontSize: {
      label: 'Font Size',
      description: 'Controls the font size in pixels',
      type: 'number',
      min: 8,
      max: 32,
      default: 14,
      section: 'editor',
      category: 'Text'
    },
    fontFamily: {
      label: 'Font Family',
      description: 'Controls the font family',
      type: 'text',
      default: "'Consolas', 'Courier New', monospace",
      section: 'editor',
      category: 'Text'
    },
    tabSize: {
      label: 'Tab Size',
      description: 'The number of spaces a tab is equal to',
      type: 'number',
      min: 1,
      max: 8,
      default: 2,
      section: 'editor',
      category: 'Text'
    },
    lineNumbers: {
      label: 'Line Numbers',
      description: 'Controls the display of line numbers',
      type: 'select',
      options: [
        { label: 'On', value: 'on' },
        { label: 'Off', value: 'off' },
        { label: 'Relative', value: 'relative' }
      ],
      default: 'on',
      section: 'editor',
      category: 'Appearance'
    },
    wordWrap: {
      label: 'Word Wrap',
      description: 'Controls how lines should wrap',
      type: 'select',
      options: [
        { label: 'Off', value: 'off' },
        { label: 'On', value: 'on' },
        { label: 'Word Wrap', value: 'wordWrapColumn' },
        { label: 'Bounded', value: 'bounded' }
      ],
      default: 'off',
      section: 'editor',
      category: 'Text'
    },
    minimap: {
      label: 'Minimap',
      description: 'Controls whether the minimap is shown',
      type: 'checkbox',
      default: true,
      section: 'editor',
      category: 'Appearance'
    },
    scrollBeyondLastLine: {
      label: 'Scroll Beyond Last Line',
      description: 'Controls whether the editor will scroll beyond the last line',
      type: 'checkbox',
      default: false,
      section: 'editor',
      category: 'Scrolling'
    },
    cursorBlinking: {
      label: 'Cursor Blinking',
      description: 'Control the cursor animation style',
      type: 'select',
      options: [
        { label: 'Blink', value: 'blink' },
        { label: 'Smooth', value: 'smooth' },
        { label: 'Phase', value: 'phase' },
        { label: 'Expand', value: 'expand' },
        { label: 'Solid', value: 'solid' }
      ],
      default: 'smooth',
      section: 'editor',
      category: 'Cursor'
    },
    formatOnPaste: {
      label: 'Format On Paste',
      description: 'Controls whether the editor should automatically format content upon paste',
      type: 'checkbox',
      default: true,
      section: 'editor',
      category: 'Formatting'
    },
    formatOnType: {
      label: 'Format On Type',
      description: 'Controls whether the editor should automatically format the line after typing',
      type: 'checkbox',
      default: true,
      section: 'editor',
      category: 'Formatting'
    },
    
    // Workbench settings
    sideBarPosition: {
      label: 'Side Bar Position',
      description: 'Controls the position of the sidebar',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' }
      ],
      default: 'left',
      section: 'workbench',
      category: 'Layout'
    },
    panelHeight: {
      label: 'Panel Height',
      description: 'Controls the default height of the panel (terminal)',
      type: 'number',
      min: 100,
      max: 500,
      default: 200,
      section: 'workbench',
      category: 'Layout'
    },
    activityBarVisible: {
      label: 'Activity Bar Visible',
      description: 'Controls the visibility of the activity bar',
      type: 'checkbox',
      default: true,
      section: 'workbench',
      category: 'Layout'
    },
    statusBarVisible: {
      label: 'Status Bar Visible',
      description: 'Controls the visibility of the status bar',
      type: 'checkbox',
      default: true,
      section: 'workbench',
      category: 'Layout'
    },
    
    // Features settings
    autoSave: {
      label: 'Auto Save',
      description: 'Controls auto save of editors',
      type: 'select',
      options: [
        { label: 'Off', value: 'off' },
        { label: 'After Delay', value: 'afterDelay' },
        { label: 'On Focus Change', value: 'onFocusChange' },
        { label: 'On Window Change', value: 'onWindowChange' }
      ],
      default: 'off',
      section: 'features',
      category: 'Files'
    },
    autoSaveDelay: {
      label: 'Auto Save Delay',
      description: 'Controls the delay in ms after which an editor is auto saved',
      type: 'number',
      min: 100,
      max: 10000,
      step: 100,
      default: 1000,
      section: 'features',
      category: 'Files'
    },
    livePreview: {
      label: 'Live Preview',
      description: 'Controls whether to automatically show preview for HTML/CSS files',
      type: 'checkbox',
      default: true,
      section: 'features',
      category: 'Preview'
    },
    languageSyntaxHighlighting: {
      label: 'Syntax Highlighting',
      description: 'Controls whether syntax highlighting is enabled',
      type: 'checkbox',
      default: true,
      section: 'features',
      category: 'Languages'
    },
    
    // Application settings
    telemetry: {
      label: 'Telemetry',
      description: 'Controls whether to send usage data and errors to the developers',
      type: 'checkbox',
      default: true,
      section: 'application',
      category: 'Privacy'
    },
    updateChannel: {
      label: 'Update Channel',
      description: 'Configure whether to receive automatic updates',
      type: 'select',
      options: [
        { label: 'Stable', value: 'stable' },
        { label: 'Insider', value: 'insider' },
        { label: 'None', value: 'none' }
      ],
      default: 'stable',
      section: 'application',
      category: 'Updates'
    },
    crashReporting: {
      label: 'Crash Reporting',
      description: 'Controls whether to send crash reports to the developers',
      type: 'checkbox',
      default: true,
      section: 'application',
      category: 'Privacy'
    }
  };

  // Initialize editor settings from defaults
  const initialEditorSettings = {};
  Object.entries(defaultEditorSettings).forEach(([key, setting]) => {
    initialEditorSettings[key] = setting.default;
  });
  
  const [editorSettings, setEditorSettings] = useState(initialEditorSettings);

  // Sample starter code for different languages
  const starterCode = {
    javascript: '// Write your JavaScript code here\nconsole.log("Hello, world!");',
    python: '# Write your Python code here\nprint("Hello, world!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}',
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>',
    css: '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}'
  }

  // Apply editor settings
  useEffect(() => {
    setTheme(editorSettings.theme);
    
    // Apply panel height setting
    const panelElement = document.querySelector('.panel');
    if (panelElement && !panelElement.classList.contains('collapsed')) {
      panelElement.style.height = `${editorSettings.panelHeight}px`;
    }
    
    // Apply activity bar visibility
    const activityBarElement = document.querySelector('.activity-bar');
    if (activityBarElement) {
      activityBarElement.style.display = editorSettings.activityBarVisible ? 'flex' : 'none';
    }
    
    // Apply status bar visibility
    const statusBarElement = document.querySelector('.status-bar');
    if (statusBarElement) {
      statusBarElement.style.display = editorSettings.statusBarVisible ? 'flex' : 'none';
    }
    
    // Apply sidebar position
    const workbenchElement = document.querySelector('.workbench');
    if (workbenchElement) {
      workbenchElement.style.flexDirection = editorSettings.sideBarPosition === 'right' ? 'row-reverse' : 'row';
    }
    
  }, [editorSettings]);
  
  // Handle settings save
  const handleSaveSettings = useCallback((newSettings) => {
    setEditorSettings(newSettings);
  }, []);

  const handleCodeChange = (value) => {
    setCode(value)
    
    // If we have an active file, update its content
    if (activeFile) {
      const updatedFiles = openFiles.map(file => 
        file.path === activeFile.path ? { ...file, content: value } : file
      );
      setOpenFiles(updatedFiles);
    }
  }

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    
    // Update active file language if exists
    if (activeFile) {
      const updatedFiles = openFiles.map(file => 
        file.path === activeFile.path ? { ...file, language: newLanguage, content: starterCode[newLanguage] || code } : file
      );
      setOpenFiles(updatedFiles);
      setCode(starterCode[newLanguage] || code)
    } else {
      // Set starter code for the selected language
      setCode(starterCode[newLanguage] || code)
    }
  }

  const handleThemeChange = (e) => {
    const newTheme = typeof e === 'object' ? e.target.value : e;
    setTheme(newTheme);
    
    // Update the editor settings as well
    setEditorSettings(prev => ({
      ...prev,
      theme: newTheme
    }));
  }

  const runCode = async () => {
    setIsLoading(true)
    setOutput('Running code...')
    
    // Make sure panel is visible when running code
    setPanelVisible(true)

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

  // Toggle panel visibility
  const togglePanel = () => {
    setPanelVisible(!panelVisible);
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }
  
  // Create a new file
  const createNewFile = () => {
    const newFile = {
      name: `untitled-${openFiles.length + 1}.js`,
      path: `/temp/untitled-${openFiles.length + 1}.js`,
      content: starterCode.javascript,
      language: 'javascript'
    };
    
    setOpenFiles([...openFiles, newFile]);
    setActiveFile(newFile);
    setLanguage('javascript');
    setCode(newFile.content);
  }

  // Open a file in the editor
  const handleFileSelect = (file) => {
    // In a real app, you would load actual file content here
    // For demo purposes, we'll use sample content based on file extension
    const extension = file.name.split('.').pop().toLowerCase();
    let content = '';
    let lang = '';
    
    // Set content and language based on file extension
    if (extension === 'js' || extension === 'jsx') {
      content = starterCode.javascript;
      lang = 'javascript';
    } else if (extension === 'py') {
      content = starterCode.python;
      lang = 'python';
    } else if (extension === 'java') {
      content = starterCode.java;
      lang = 'java';
    } else if (extension === 'cpp') {
      content = starterCode.cpp;
      lang = 'cpp';
    } else if (extension === 'html') {
      content = starterCode.html;
      lang = 'html';
    } else if (extension === 'css') {
      content = starterCode.css;
      lang = 'css';
    } else {
      content = '// Unknown file type';
      lang = 'plaintext';
    }
    
    // Check if the file is already open
    const existingFile = openFiles.find(f => f.path === file.path);
    
    if (existingFile) {
      setActiveFile(existingFile);
      setLanguage(existingFile.language);
      setCode(existingFile.content);
    } else {
      const newFile = { ...file, content, language: lang };
      setOpenFiles([...openFiles, newFile]);
      setActiveFile(newFile);
      setLanguage(lang);
      setCode(content);
    }
  }

  // Close a file tab
  const closeFile = (fileToClose) => {
    const updatedFiles = openFiles.filter(file => file.path !== fileToClose.path);
    setOpenFiles(updatedFiles);
    
    // If we closed the active file, activate another file if available
    if (activeFile && fileToClose.path === activeFile.path) {
      if (updatedFiles.length > 0) {
        const newActiveFile = updatedFiles[updatedFiles.length - 1];
        setActiveFile(newActiveFile);
        setLanguage(newActiveFile.language);
        setCode(newActiveFile.content);
      } else {
        setActiveFile(null);
        setCode('// Write your code here...\nconsole.log("Hello, world!");');
        setLanguage('javascript');
      }
    }
  }

  // Active a file when its tab is clicked
  const activateFile = (fileToActivate) => {
    setActiveFile(fileToActivate);
    setLanguage(fileToActivate.language);
    setCode(fileToActivate.content);
  }

  // Mock file explorer data
  const fileExplorerData = [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'App.js', type: 'file', path: '/src/App.js' },
        { name: 'index.js', type: 'file', path: '/src/index.js' },
        { name: 'styles.css', type: 'file', path: '/src/styles.css' }
      ]
    },
    {
      name: 'public',
      type: 'folder',
      children: [
        { name: 'index.html', type: 'file', path: '/public/index.html' }
      ]
    },
    { name: 'package.json', type: 'file', path: '/package.json' },
    { name: 'README.md', type: 'file', path: '/README.md' }
  ];

  // File Explorer Component
  const FileExplorer = ({ data, level = 0 }) => {
    const [expandedFolders, setExpandedFolders] = useState({});
    
    const toggleFolder = (folderPath) => {
      setExpandedFolders(prev => ({
        ...prev,
        [folderPath]: !prev[folderPath]
      }));
    };
    
    return (
      <div className="file-explorer">
        {data.map((item, index) => (
          <div key={index}>
            <div 
              className={`file-item ${item.type} ${activeFile && activeFile.path === item.path ? 'active' : ''}`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                if (item.type === 'folder') {
                  toggleFolder(item.path || item.name);
                } else {
                  handleFileSelect(item);
                }
              }}
            >
              {item.type === 'folder' ? (
                <span className="folder-icon">
                  {expandedFolders[item.path || item.name] ? '📂' : '📁'}
                </span>
              ) : (
                <span className="file-icon">
                  {item.name.endsWith('.js') ? '📄' : 
                   item.name.endsWith('.css') ? '🎨' :
                   item.name.endsWith('.html') ? '🌐' :
                   item.name.endsWith('.json') ? '📋' :
                   item.name.endsWith('.md') ? '📝' : '📄'}
                </span>
              )}
              <span className="file-name">{item.name}</span>
            </div>
            
            {item.type === 'folder' && item.children && expandedFolders[item.path || item.name] && (
              <FileExplorer data={item.children} level={level + 1} />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Added keyboard shortcut for running code
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F5 or Ctrl+F5 to run code
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'F5')) {
        e.preventDefault();
        runCode();
      }
      // Ctrl+` to toggle terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language]); // Dependencies include code and language

  return (
    <div className={`vs-code-container ${theme === 'vs-dark' ? 'dark-theme' : 'light-theme'}`}>
      {/* Title bar */}
      <div className="title-bar">
        <div className="window-title">GeistEditor - Modern Code Editor</div>
        <div className="window-controls">
          <span className="window-control minimize">—</span>
          <span className="window-control maximize">□</span>
          <span className="window-control close" onClick={goToHome}>×</span>
        </div>
      </div>
      
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Go</div>
        <div className="menu-item">Run</div>
        <div className="menu-item">Terminal</div>
        <div className="menu-item">Help</div>
      </div>
      
      {/* Main workbench area */}
      <div className="workbench">
        {/* Activity Bar */}
        <div className="activity-bar" style={{ display: editorSettings.activityBarVisible ? 'flex' : 'none' }}>
          <ActivityBarIcon 
            icon="📁" 
            active={activeView === 'explorer'} 
            title="Explorer" 
            onClick={() => {
              setActiveView('explorer');
              setSidebarCollapsed(false);
            }}
          />
          <ActivityBarIcon 
            icon="🔍" 
            active={activeView === 'search'} 
            title="Search" 
            onClick={() => {
              setActiveView('search');
              setSidebarCollapsed(false);
            }}
          />
          <ActivityBarIcon 
            icon="⑂" 
            active={activeView === 'git'} 
            title="Source Control" 
            onClick={() => {
              setActiveView('git');
              setSidebarCollapsed(false);
            }}
          />
          <ActivityBarIcon 
            icon="▶" 
            active={activeView === 'debug'} 
            title="Run and Debug" 
            onClick={() => {
              setActiveView('debug');
              setSidebarCollapsed(false);
            }}
          />
          <ActivityBarIcon 
            icon="⧉" 
            active={activeView === 'extensions'} 
            title="Extensions" 
            onClick={() => {
              setActiveView('extensions');
              setSidebarCollapsed(false);
            }}
          />
          
          <div className="activity-bar-bottom">
            <ActivityBarIcon 
              icon="⚙️" 
              active={activeView === 'settings'} 
              title="Settings" 
              onClick={() => {
                setActiveView('settings');
                setSidebarCollapsed(false);
              }}
            />
          </div>
        </div>
        
        {/* Side Bar */}
        <div className={`side-bar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="side-bar-title">
            <span>
              {activeView === 'explorer' ? 'EXPLORER' : 
               activeView === 'search' ? 'SEARCH' :
               activeView === 'git' ? 'SOURCE CONTROL' :
               activeView === 'debug' ? 'RUN AND DEBUG' :
               activeView === 'extensions' ? 'EXTENSIONS' :
               'SETTINGS'}
            </span>
            <button 
              className="side-bar-close"
              onClick={toggleSidebar}
              title="Close Side Bar"
            >
              ×
            </button>
          </div>
          
          {activeView === 'explorer' && (
            <div className="explorer-view">
              <div className="explorer-section">
                <div className="section-header">
                  <span>OPEN EDITORS</span>
                </div>
                <div className="section-content">
                  {openFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className={`file-item file ${activeFile && activeFile.path === file.path ? 'active' : ''}`}
                      onClick={() => activateFile(file)}
                    >
                      <span className="file-icon">
                        {file.name.endsWith('.js') ? '📄' : 
                         file.name.endsWith('.css') ? '🎨' :
                         file.name.endsWith('.html') ? '🌐' :
                         file.name.endsWith('.json') ? '📋' :
                         file.name.endsWith('.md') ? '📝' : '📄'}
                      </span>
                      <span className="file-name">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="explorer-section">
                <div className="section-header">
                  <span>PROJECT</span>
                </div>
                <div className="section-content">
                  <FileExplorer data={fileExplorerData} />
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'debug' && (
            <div className="debug-view">
              <div className="debug-controls">
                <button 
                  className="run-button" 
                  onClick={runCode}
                  disabled={isLoading}
                >
                  {isLoading ? 'Running...' : 'Run Code'}
                </button>
                <div className="language-selection">
                  <label>Language:</label>
                  <select value={language} onChange={handleLanguageChange}>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                </div>
                <div className="theme-selection">
                  <label>Theme:</label>
                  <select value={theme} onChange={handleThemeChange}>
                    <option value="vs-dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="hc-black">High Contrast Dark</option>
                    <option value="hc-light">High Contrast Light</option>
                  </select>
                </div>
                <button onClick={clearOutput}>Clear Output</button>
              </div>
            </div>
          )}
          
          {activeView === 'settings' && (
            <SettingsComponent 
              settings={editorSettings}
              onSave={handleSaveSettings}
              defaultSettings={defaultEditorSettings}
            />
          )}
          
          {activeView === 'search' && <div className="placeholder-panel">Search Panel</div>}
          {activeView === 'git' && <div className="placeholder-panel">Source Control Panel</div>}
          {activeView === 'extensions' && <div className="placeholder-panel">Extensions Panel</div>}
        </div>
        
        {/* Editor Group */}
        <div className="editor-group" style={{ display: activeView === 'settings' ? 'none' : 'flex' }}>
          {/* Editor Tabs */}
          <div className="editor-tabs">
            {openFiles.length > 0 ? (
              openFiles.map((file, index) => (
                <EditorTab 
                  key={index}
                  file={file} 
                  active={activeFile && activeFile.path === file.path} 
                  onSelect={() => activateFile(file)}
                  onClose={() => closeFile(file)}
                />
              ))
            ) : (
              <div className="welcome-tab active">Welcome</div>
            )}
            <div className="new-tab" onClick={createNewFile} title="New File">+</div>
          </div>
          
          {/* Editor Content */}
          <div className="editor-content">
            {openFiles.length > 0 ? (
              <Editor
                height="100%"
                width="100%"
                defaultLanguage="javascript"
                language={language}
                theme={theme}
                value={code}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: editorSettings.minimap },
                  fontSize: editorSettings.fontSize,
                  tabSize: editorSettings.tabSize,
                  fontFamily: editorSettings.fontFamily,
                  wordWrap: editorSettings.wordWrap,
                  lineNumbers: editorSettings.lineNumbers,
                  scrollBeyondLastLine: editorSettings.scrollBeyondLastLine,
                  renderLineHighlight: 'all',
                  cursorBlinking: editorSettings.cursorBlinking,
                  formatOnPaste: editorSettings.formatOnPaste,
                  formatOnType: editorSettings.formatOnType,
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="welcome-page">
                <h1>Welcome to GeistEditor</h1>
                <p>A modern code editor with support for multiple languages</p>
                <div className="welcome-actions">
                  <button onClick={createNewFile}>Create a new file</button>
                  <button onClick={() => {
                    setActiveView('explorer');
                    setSidebarCollapsed(false);
                  }}>Open a file</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Always show a compact language selector in the editor area */}
          <div className="editor-language-bar">
            <div className="language-selector">
              <select value={language} onChange={handleLanguageChange} title="Select Language">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>
            <button 
              className="run-code-button" 
              onClick={runCode} 
              disabled={isLoading}
              title="Run Code (F5)"
            >
              {isLoading ? 'Running...' : 'Run'}
            </button>
          </div>
          
          {/* Terminal/Output Panel */}
          <div 
            className={`panel ${panelVisible ? '' : 'collapsed'}`} 
            style={{ height: panelVisible ? `${editorSettings.panelHeight}px` : '35px' }}
          >
            <div className="panel-header">
              <div className="panel-tabs">
                <div className="panel-tab active">TERMINAL</div>
                <div className="panel-tab">OUTPUT</div>
                <div className="panel-tab">PROBLEMS</div>
                <div className="panel-tab">DEBUG CONSOLE</div>
              </div>
              <div className="panel-actions">
                <button className="panel-action" title="Clear Terminal" onClick={clearOutput}>🗑️</button>
                <button className="panel-action" title="Maximize Panel">⬆</button>
                <button className="panel-action" title="Close Panel" onClick={togglePanel}>✕</button>
              </div>
            </div>
            <div className="panel-content">
              <div className="terminal">
                <pre>{output || '> Terminal ready'}</pre>
                <div id="preview-container" className="preview-container"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="status-bar" style={{ display: editorSettings.statusBarVisible ? 'flex' : 'none' }}>
        <div className="status-left">
          <div className="status-item">
            <span className="status-icon">📡</span>
            <span>Ready</span>
          </div>
          <div className="status-item" onClick={() => runCode()}>
            <span className="status-icon">▶</span>
            <span>{isLoading ? 'Running...' : 'Run'}</span>
          </div>
        </div>
        <div className="status-right">
          <div className="status-item">
            <span>Ln 1, Col 1</span>
          </div>
          <div className="status-item">
            <span>{language.toUpperCase()}</span>
          </div>
          <div className="status-item" onClick={() => handleThemeChange(theme === 'vs-dark' ? 'light' : 'vs-dark')}>
            <span>{theme === 'vs-dark' || theme === 'hc-black' ? '☾' : '☀'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
