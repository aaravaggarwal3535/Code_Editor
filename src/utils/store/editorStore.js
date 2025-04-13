import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Editor store using Zustand
 * Manages editor state, settings, and output
 */
const useEditorStore = create(
  persist(
    (set, get) => ({
      // Core state
      code: '// Write your code here...\nconsole.log("Hello, world!");',
      language: 'javascript',
      theme: 'vs-dark',
      output: '',
      isLoading: false,
      
      // UI state
      isSidebarOpen: true,
      isOutputExpanded: false,
      autoSaveEnabled: true,
      livePreviewEnabled: true,
      
      // Language configuration
      starterCode: {
        javascript: '// Write your JavaScript code here\nconsole.log("Hello, world!");',
        python: '# Write your Python code here\nprint("Hello, world!")',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
        cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}',
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>',
        css: '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}'
      },
      
      languageIcons: {
        javascript: '📜',
        python: '🐍',
        java: '☕',
        cpp: '⚙️',
        html: '🌐',
        css: '🎨',
        txt: '📄',
        md: '📝',
        json: '📊',
        default: '📄'
      },

      // Core editor actions
      setCode: (code) => set({ code }),
      setLanguage: (language) => set((state) => {
        // If changing language without a selected file, update to starter code
        const shouldUpdateCode = !get().currentFile && state.starterCode[language];
        return {
          language,
          ...(shouldUpdateCode ? { code: state.starterCode[language] } : {})
        };
      }),
      setTheme: (theme) => set({ theme }),
      setOutput: (output) => set({ output }),
      clearOutput: () => set({ output: '' }),
      setIsLoading: (isLoading) => set({ isLoading }),
      
      // UI actions
      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleOutputPanel: () => set(state => ({ isOutputExpanded: !state.isOutputExpanded })),
      setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
      setLivePreviewEnabled: (enabled) => set({ livePreviewEnabled: enabled }),
      setOutputExpanded: (expanded) => set({ isOutputExpanded: expanded }),
      
      // Execute code
      runCode: async () => {
        set({ isLoading: true, output: 'Running code...', isOutputExpanded: true });
        
        const { language, code } = get();
        
        try {
          if (language === 'javascript' && window.location.hostname === 'localhost') {
            // Run JavaScript in the browser
            let consoleOutput = [];
            const originalConsoleLog = console.log;
            console.log = (...args) => {
              consoleOutput.push(args.join(' '));
            };
            
            try {
              // eslint-disable-next-line no-eval
              eval(code);
              set({ output: consoleOutput.join('\n') || 'Code executed successfully (no output)' });
            } catch (error) {
              set({ output: `Error: ${error.message}` });
            }
            
            console.log = originalConsoleLog;
          } else if (language === 'html') {
            // For HTML, notify for preview rendering
            set({ output: 'HTML preview rendered' });
          } else if (language === 'css') {
            // For CSS, notify for preview rendering
            set({ output: 'CSS preview rendered' });
          } else {
            // For other languages, send to backend
            const response = await fetch('http://localhost:3001/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, language })
            });
            
            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error && data.error.trim() !== '') {
              set({ output: `${data.result || ''}\n\nError: ${data.error}` });
            } else if (data.result) {
              set({ output: data.result });
            } else {
              set({ output: 'No output received from the program.' });
            }
          }
        } catch (error) {
          console.error('Code execution error:', error);
          set({ output: `Failed to execute code: ${error.message}` });
        } finally {
          set({ isLoading: false });
        }
      },
      
      getFileName: () => {
        const { currentFile, language } = get();
        
        if (currentFile) {
          return currentFile.name;
        }
        
        switch (language) {
          case 'javascript': return 'script.js';
          case 'python': return 'main.py';
          case 'java': return 'Main.java';
          case 'cpp': return 'main.cpp';
          case 'html': return 'index.html';
          case 'css': return 'styles.css';
          default: return 'file.txt';
        }
      },
      
      getFileIcon: (fileName) => {
        const { languageIcons } = get();
        const extension = fileName.split('.').pop().toLowerCase();
        return languageIcons[extension] || languageIcons.default;
      }
    }),
    {
      name: 'editor-storage', // Storage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useEditorStore;