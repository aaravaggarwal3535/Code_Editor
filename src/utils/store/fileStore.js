import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * File system store using Zustand
 * Manages files, folders and related operations
 */
const useFileStore = create(
  persist(
    (set, get) => ({
      // File explorer state
      files: [],
      folders: [],
      currentFile: null,
      expandedFolders: {},
      
      // Initialize with sample files and folders
      initializeFileSystem: (starterCode) => {
        const files = [
          { id: '1', name: 'script.js', type: 'javascript', content: starterCode.javascript, parent: null },
          { id: '2', name: 'main.py', type: 'python', content: starterCode.python, parent: null },
          { id: '3', name: 'styles.css', type: 'css', content: starterCode.css, parent: null },
          { id: '4', name: 'index.html', type: 'html', content: starterCode.html, parent: null },
          { id: '5', name: 'config.json', type: 'json', content: '{\n  "name": "My Project",\n  "version": "1.0.0"\n}', parent: 'folder1' },
          { id: '6', name: 'README.md', type: 'md', content: '# My Project\n\nThis is a sample project.', parent: null },
          { id: '7', name: 'utils.js', type: 'javascript', content: '// Utility functions\nfunction formatDate(date) {\n  return date.toLocaleDateString();\n}\n\nfunction formatTime(date) {\n  return date.toLocaleTimeString();\n}', parent: 'folder2' }
        ];
        
        const folders = [
          { id: 'folder1', name: 'config', parent: null },
          { id: 'folder2', name: 'utils', parent: null },
          { id: 'folder3', name: 'assets', parent: null },
          { id: 'folder4', name: 'scripts', parent: 'folder3' }
        ];
        
        const expandedFolders = {
          'folder1': true,
          'folder2': true,
          'folder3': false
        };
        
        set({ 
          files, 
          folders, 
          expandedFolders,
          currentFile: files[0]
        });
      },
      
      // File operations
      setCurrentFile: (file) => set({ currentFile: file }),
      
      updateFileContent: (fileId, content) => set(state => ({
        files: state.files.map(file => 
          file.id === fileId ? { ...file, content } : file
        )
      })),
      
      addFile: (fileName, fileType, content, parent = null) => {
        const newFile = {
          id: `file_${Date.now()}`,
          name: fileName,
          type: fileType,
          content: content || '',
          parent
        };
        
        set(state => ({ 
          files: [...state.files, newFile],
          currentFile: newFile
        }));
        
        return newFile;
      },
      
      addFolder: (folderName, parent = null) => {
        const newFolder = {
          id: `folder_${Date.now()}`,
          name: folderName,
          parent
        };
        
        set(state => ({ 
          folders: [...state.folders, newFolder],
          expandedFolders: {
            ...state.expandedFolders,
            [newFolder.id]: true
          }
        }));
        
        return newFolder;
      },
      
      deleteItem: (itemId, itemType) => {
        if (itemType === 'file') {
          set(state => {
            // If deleting the current file, clear the selection
            const newState = { files: state.files.filter(file => file.id !== itemId) };
            if (state.currentFile && state.currentFile.id === itemId) {
              newState.currentFile = null;
            }
            return newState;
          });
        } else {
          // Delete folder and its contents recursively
          set(state => {
            // Helper function to collect all subfolder IDs recursively
            const collectSubfolders = (folderId, foldersList) => {
              const result = [folderId];
              const subfolders = foldersList.filter(f => f.parent === folderId).map(f => f.id);
              
              subfolders.forEach(subId => {
                result.push(...collectSubfolders(subId, foldersList));
              });
              
              return result;
            };
            
            // Get all folder IDs to be deleted
            const folderIdsToDelete = collectSubfolders(itemId, state.folders);
            
            // Filter out deleted folders
            const newFolders = state.folders.filter(folder => 
              !folderIdsToDelete.includes(folder.id)
            );
            
            // Filter out files from deleted folders
            const newFiles = state.files.filter(file => 
              !folderIdsToDelete.includes(file.parent)
            );
            
            return { folders: newFolders, files: newFiles };
          });
        }
      },
      
      renameItem: (itemId, newName, itemType) => {
        if (itemType === 'file') {
          set(state => ({
            files: state.files.map(file => 
              file.id === itemId ? { ...file, name: newName } : file
            ),
            // Update current file reference if it's being renamed
            currentFile: state.currentFile && state.currentFile.id === itemId 
              ? { ...state.currentFile, name: newName }
              : state.currentFile
          }));
        } else {
          set(state => ({
            folders: state.folders.map(folder => 
              folder.id === itemId ? { ...folder, name: newName } : folder
            )
          }));
        }
      },
      
      moveItem: (itemId, targetFolderId, itemType) => {
        if (itemType === 'file') {
          set(state => ({
            files: state.files.map(file => 
              file.id === itemId ? { ...file, parent: targetFolderId } : file
            )
          }));
        } else {
          // Can't move a folder inside itself or its descendants
          const isValidMove = (folderId, targetId) => {
            if (folderId === targetId) return false;
            
            // Check if target is a descendant of the folder
            const findAllDescendants = (parentId) => {
              const descendants = [];
              
              const folders = get().folders.filter(f => f.parent === parentId);
              if (folders.length === 0) return descendants;
              
              folders.forEach(folder => {
                descendants.push(folder.id);
                descendants.push(...findAllDescendants(folder.id));
              });
              
              return descendants;
            };
            
            const descendants = findAllDescendants(folderId);
            return !descendants.includes(targetId);
          };
          
          if (isValidMove(itemId, targetFolderId)) {
            set(state => ({
              folders: state.folders.map(folder => 
                folder.id === itemId ? { ...folder, parent: targetFolderId } : folder
              )
            }));
            return true;
          }
          return false;
        }
      },
      
      toggleFolder: (folderId) => set(state => ({
        expandedFolders: {
          ...state.expandedFolders,
          [folderId]: !state.expandedFolders[folderId]
        }
      })),
    }),
    {
      name: 'file-storage', // Storage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useFileStore;