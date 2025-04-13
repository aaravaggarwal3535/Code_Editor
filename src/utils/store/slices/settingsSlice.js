import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Async thunk for changing theme with persistence
 */
export const setTheme = createAsyncThunk(
  'settings/setTheme',
  async (theme, { rejectWithValue }) => {
    try {
      // Persist theme preference
      localStorage.setItem('app_theme', theme);

      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);

      return theme;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Settings slice for Redux store
 * Handles application-wide settings
 */
const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    theme: localStorage.getItem('app_theme') || 'dark',
    fontSize: parseInt(localStorage.getItem('font_size') || '14'),
    tabSize: parseInt(localStorage.getItem('tab_size') || '2'),
    wordWrap: localStorage.getItem('word_wrap') === 'true',
    lineNumbers: localStorage.getItem('line_numbers') !== 'false',
    minimap: localStorage.getItem('minimap') !== 'false',
    autoSave: localStorage.getItem('auto_save') !== 'false',
    notifications: {
      showErrors: true,
      showSuccess: true,
      showInfo: true,
      position: 'bottom-right'
    },
    accessibility: {
      highContrast: false,
      largeText: false
    },
    monaco: null, // Reference to Monaco editor instance (non-serializable)
    isLoading: false,
    error: null,
  },
  reducers: {
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
      localStorage.setItem('font_size', action.payload);
    },
    setTabSize: (state, action) => {
      state.tabSize = action.payload;
      localStorage.setItem('tab_size', action.payload);
    },
    toggleWordWrap: (state) => {
      state.wordWrap = !state.wordWrap;
      localStorage.setItem('word_wrap', state.wordWrap);
    },
    toggleLineNumbers: (state) => {
      state.lineNumbers = !state.lineNumbers;
      localStorage.setItem('line_numbers', state.lineNumbers);
    },
    toggleMinimap: (state) => {
      state.minimap = !state.minimap;
      localStorage.setItem('minimap', state.minimap);
    },
    toggleAutoSave: (state) => {
      state.autoSave = !state.autoSave;
      localStorage.setItem('auto_save', state.autoSave);
    },
    setMonacoInstance: (state, action) => {
      state.monaco = action.payload;
    },
    updateNotificationSettings: (state, action) => {
      state.notifications = {
        ...state.notifications,
        ...action.payload
      };
    },
    updateAccessibilitySettings: (state, action) => {
      state.accessibility = {
        ...state.accessibility,
        ...action.payload
      };
      
      // Apply accessibility settings
      const { highContrast, largeText } = state.accessibility;
      document.documentElement.classList.toggle('high-contrast', highContrast);
      document.documentElement.classList.toggle('large-text', largeText);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setTheme.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setTheme.fulfilled, (state, action) => {
        state.isLoading = false;
        state.theme = action.payload;
      })
      .addCase(setTheme.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to change theme';
      });
  },
});

export const {
  setFontSize,
  setTabSize,
  toggleWordWrap,
  toggleLineNumbers,
  toggleMinimap,
  toggleAutoSave,
  setMonacoInstance,
  updateNotificationSettings,
  updateAccessibilitySettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;