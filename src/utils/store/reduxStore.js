import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import projectReducer from './slices/projectSlice';

/**
 * Redux store configuration
 * Used for more complex global state management scenarios
 * while Zustand handles editor-specific state
 */
export const store = configureStore({
  reducer: {
    user: userReducer,
    settings: settingsReducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['settings/setTheme/fulfilled', 'settings/setMonacoInstance'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.callback', 'payload.monaco'],
        // Ignore these paths in the state
        ignoredPaths: ['settings.monaco'],
      },
    }),
});

// Export type definitions for TypeScript projects
export const RootState = store.getState();
export const AppDispatch = store.dispatch;

export default store;