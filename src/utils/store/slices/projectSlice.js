import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Async thunk for loading project data
 */
export const loadProject = createAsyncThunk(
  'project/load',
  async (projectId, { rejectWithValue }) => {
    try {
      // Simulate API call to load project
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 200,
            data: {
              id: projectId,
              name: `Project ${projectId}`,
              description: 'Sample project description',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              files: [
                { id: '1', name: 'index.html', type: 'html', path: '/' },
                { id: '2', name: 'styles.css', type: 'css', path: '/' },
                { id: '3', name: 'app.js', type: 'javascript', path: '/' },
              ],
              collaborators: [
                { id: '1', username: 'demo', role: 'owner' }
              ]
            }
          });
        }, 1000);
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for saving project data
 */
export const saveProject = createAsyncThunk(
  'project/save',
  async (projectData, { rejectWithValue }) => {
    try {
      // Simulate API call to save project
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 200,
            data: {
              ...projectData,
              updatedAt: new Date().toISOString()
            }
          });
        }, 1000);
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Project slice for Redux store
 * Handles project metadata and management
 */
const projectSlice = createSlice({
  name: 'project',
  initialState: {
    currentProject: null,
    recentProjects: [],
    shareLink: null,
    isPublic: false,
    collaborators: [],
    projectHistory: [],
    currentHistoryIndex: -1,
    unsavedChanges: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
      state.unsavedChanges = false;
      
      // Add to recent projects if not already there
      if (action.payload) {
        const exists = state.recentProjects.some(p => p.id === action.payload.id);
        
        if (!exists) {
          state.recentProjects = [
            action.payload,
            ...state.recentProjects.slice(0, 9) // Keep only 10 recent projects
          ];
        } else {
          // Move to top if it exists
          state.recentProjects = [
            action.payload,
            ...state.recentProjects.filter(p => p.id !== action.payload.id)
          ];
        }
      }
    },
    
    markUnsaved: (state) => {
      state.unsavedChanges = true;
    },
    
    addToProjectHistory: (state, action) => {
      // Trim history if we're not at the latest point
      if (state.currentHistoryIndex < state.projectHistory.length - 1) {
        state.projectHistory = state.projectHistory.slice(0, state.currentHistoryIndex + 1);
      }
      
      state.projectHistory.push(action.payload);
      state.currentHistoryIndex = state.projectHistory.length - 1;
    },
    
    undoProjectChange: (state) => {
      if (state.currentHistoryIndex > 0) {
        state.currentHistoryIndex--;
        state.currentProject = {
          ...state.currentProject,
          files: state.projectHistory[state.currentHistoryIndex].files
        };
      }
    },
    
    redoProjectChange: (state) => {
      if (state.currentHistoryIndex < state.projectHistory.length - 1) {
        state.currentHistoryIndex++;
        state.currentProject = {
          ...state.currentProject,
          files: state.projectHistory[state.currentHistoryIndex].files
        };
      }
    },
    
    toggleProjectVisibility: (state) => {
      state.isPublic = !state.isPublic;
      
      if (state.isPublic && !state.shareLink) {
        state.shareLink = `https://codeeditor.example/share/${state.currentProject?.id || 'unknown'}-${Date.now().toString(36)}`;
      }
    },
    
    addCollaborator: (state, action) => {
      const collaborator = action.payload;
      const existingIndex = state.collaborators.findIndex(c => c.id === collaborator.id);
      
      if (existingIndex >= 0) {
        state.collaborators[existingIndex] = collaborator;
      } else {
        state.collaborators.push(collaborator);
      }
    },
    
    removeCollaborator: (state, action) => {
      state.collaborators = state.collaborators.filter(c => c.id !== action.payload);
    },
    
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Loading project
      .addCase(loadProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
        state.unsavedChanges = false;
        state.projectHistory = [{ files: action.payload.files }];
        state.currentHistoryIndex = 0;
        
        // Add to recent projects
        const exists = state.recentProjects.some(p => p.id === action.payload.id);
        
        if (!exists) {
          state.recentProjects = [
            {
              id: action.payload.id,
              name: action.payload.name,
              updatedAt: action.payload.updatedAt
            },
            ...state.recentProjects.slice(0, 9) // Keep only 10 recent projects
          ];
        }
      })
      .addCase(loadProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load project';
      })
      
      // Saving project
      .addCase(saveProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
        state.unsavedChanges = false;
        
        // Update in recent projects list
        const projectIndex = state.recentProjects.findIndex(p => p.id === action.payload.id);
        if (projectIndex >= 0) {
          state.recentProjects[projectIndex] = {
            id: action.payload.id,
            name: action.payload.name,
            updatedAt: action.payload.updatedAt
          };
        }
      })
      .addCase(saveProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to save project';
      });
  },
});

export const {
  setCurrentProject,
  markUnsaved,
  addToProjectHistory,
  undoProjectChange,
  redoProjectChange,
  toggleProjectVisibility,
  addCollaborator,
  removeCollaborator,
  clearProjectError,
} = projectSlice.actions;

export default projectSlice.reducer;