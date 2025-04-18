import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

const Settings = ({ settings, onSave, defaultSettings, theme }) => {
  const [activeSection, setActiveSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSettings, setLocalSettings] = useState(settings);

  // Sample code for the preview
  const previewCode = `// This is a preview of your editor settings
function greet(name) {
  console.log("Hello, " + name + "!");
  
  // Testing indentation and formatting
  if (name.length > 0) {
    return {
      message: "Greeting sent",
      timestamp: new Date()
    };
  }
  
  return null;
}

// Testing long line wrapping behavior
const veryLongLine = "This is a very long line that might need to wrap depending on your editor settings and preferences...";

// Array for testing various formatting options
const items = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
  { id: 3, name: "Item 3" }
];`;

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      onSave(newSettings);
      return newSettings;
    });
  };

  const resetSection = (section) => {
    const resetValues = {};
    Object.entries(defaultSettings).forEach(([key, setting]) => {
      if (section === 'all' || setting.section === section) {
        resetValues[key] = setting.default;
      }
    });
    setLocalSettings(prev => ({
      ...prev,
      ...resetValues
    }));
    onSave({ ...localSettings, ...resetValues });
  };

  const getFilteredSettings = () => {
    return Object.entries(defaultSettings).filter(([key, setting]) => {
      const matchesSection = activeSection === 'all' || setting.section === activeSection;
      const matchesSearch = !searchQuery || 
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (setting.description && setting.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSection && matchesSearch;
    });
  };

  const renderSettingInput = (key, setting) => {
    const value = localSettings[key];

    switch (setting.type) {
      case 'select':
        return (
          <select 
            value={value} 
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="settings-select"
          >
            {setting.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input 
            type="checkbox" 
            checked={value} 
            onChange={(e) => handleSettingChange(key, e.target.checked)}
            className="settings-checkbox"
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
            className="settings-number"
          />
        );

      default:
        return (
          <input 
            type="text" 
            value={value} 
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="settings-text"
          />
        );
    }
  };

  const sections = [
    { id: 'all', icon: '🔧', label: 'All Settings' },
    { id: 'editor', icon: '📝', label: 'Editor' },
    { id: 'workbench', icon: '💻', label: 'Workbench' },
    { id: 'features', icon: '✨', label: 'Features' },
    { id: 'application', icon: '⚙️', label: 'Application' }
  ];

  return (
    <div className="settings-container">
      {/* Settings Sidebar */}
      <div className="settings-sidebar">
        {/* Search bar */}
        <div className="settings-search">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="settings-search-input"
          />
        </div>

        {/* Section navigation */}
        <div className="settings-nav">
          {sections.map(section => (
            <div
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              <span className="settings-nav-label">{section.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Main Content */}
      <div className="settings-main">
        {/* Section header */}
        <div className="settings-header">
          <h2>{sections.find(s => s.id === activeSection)?.label}</h2>
          <button 
            onClick={() => resetSection(activeSection)}
            className="settings-reset-button"
          >
            Reset Section
          </button>
        </div>

        {/* Editor preview for editor settings */}
        {activeSection === 'editor' && (
          <div className="settings-preview">
            <h3>Preview</h3>
            <div className="editor-preview">
              <Editor
                height="200px"
                language="javascript"
                theme={theme}
                value={previewCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: localSettings.minimap },
                  fontSize: localSettings.fontSize,
                  fontFamily: localSettings.fontFamily,
                  tabSize: localSettings.tabSize,
                  wordWrap: localSettings.wordWrap,
                  lineNumbers: localSettings.lineNumbers,
                  scrollBeyondLastLine: localSettings.scrollBeyondLastLine,
                  cursorStyle: localSettings.cursorStyle,
                  cursorBlinking: localSettings.cursorBlinking,
                  formatOnPaste: localSettings.formatOnPaste,
                  formatOnType: localSettings.formatOnType,
                }}
              />
            </div>
          </div>
        )}

        {/* Settings list */}
        <div className="settings-list">
          {getFilteredSettings().map(([key, setting]) => (
            <div key={key} className="setting-item">
              <div className="setting-header">
                <div className="setting-info">
                  <label className="setting-label">{setting.label}</label>
                  {setting.description && (
                    <p className="setting-description">{setting.description}</p>
                  )}
                </div>
                <button 
                  onClick={() => handleSettingChange(key, setting.default)}
                  className="setting-reset-button"
                  title="Reset to default"
                >
                  ↺
                </button>
              </div>
              <div className="setting-input">
                {renderSettingInput(key, setting)}
              </div>
            </div>
          ))}

          {getFilteredSettings().length === 0 && (
            <div className="no-settings-message">
              {searchQuery 
                ? "No settings match your search" 
                : "No settings available in this section"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;