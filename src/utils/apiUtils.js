/**
 * API utilities for handling server requests
 */

// Default API configuration
const API_CONFIG = {
  baseURL: 'http://localhost:3001', // Default development URL
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
};

// Customize API config based on environment
if (import.meta.env.PROD) {
  API_CONFIG.baseURL = import.meta.env.VITE_API_URL || API_CONFIG.baseURL;
}

/**
 * Custom fetch wrapper with enhanced features
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise with response data
 */
export const apiFetch = async (url, options = {}) => {
  // Merge default headers with custom headers
  const headers = {
    ...API_CONFIG.headers,
    ...options.headers
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Prepare fetch options
  const fetchOptions = {
    ...options,
    headers,
  };

  // Handle request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_CONFIG.timeout);
  fetchOptions.signal = controller.signal;

  try {
    // Make the request
    const response = await fetch(`${API_CONFIG.baseURL}${url}`, fetchOptions);
    
    // Clear timeout
    clearTimeout(timeoutId);

    // Parse response based on content type
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Handle error responses
    if (!response.ok) {
      const error = new Error(data.message || response.statusText);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Enhance error object
    if (error.name === 'AbortError') {
      error.message = 'Request timeout';
    }
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`API Error (${url}):`, error);
    }
    
    throw error;
  }
};

/**
 * Code execution API
 */
export const codeApi = {
  /**
   * Execute code in a specific language
   * @param {string} code - Code to execute
   * @param {string} language - Programming language
   * @returns {Promise} - Execution result
   */
  executeCode: (code, language) => {
    return apiFetch('/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
  },
  
  /**
   * Get available language versions
   * @returns {Promise} - Available languages and their versions
   */
  getLanguageVersions: () => {
    return apiFetch('/languages', {
      method: 'GET'
    });
  }
};

/**
 * Project API
 */
export const projectApi = {
  /**
   * Get all user projects
   * @returns {Promise} - List of projects
   */
  listProjects: () => {
    return apiFetch('/projects', {
      method: 'GET'
    });
  },
  
  /**
   * Get a specific project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise} - Project details
   */
  getProject: (projectId) => {
    return apiFetch(`/projects/${projectId}`, {
      method: 'GET'
    });
  },
  
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise} - Created project
   */
  createProject: (projectData) => {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },
  
  /**
   * Update a project
   * @param {string} projectId - Project ID
   * @param {Object} projectData - Project data to update
   * @returns {Promise} - Updated project
   */
  updateProject: (projectId, projectData) => {
    return apiFetch(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  },
  
  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @returns {Promise} - Deletion result
   */
  deleteProject: (projectId) => {
    return apiFetch(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }
};

/**
 * User API
 */
export const userApi = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @returns {Promise} - Login result with token
   */
  login: (credentials) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Registration result
   */
  register: (userData) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  /**
   * Get current user profile
   * @returns {Promise} - User profile
   */
  getProfile: () => {
    return apiFetch('/user/profile', {
      method: 'GET'
    });
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - Updated profile
   */
  updateProfile: (profileData) => {
    return apiFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },
  
  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise} - Password change result
   */
  changePassword: (passwordData) => {
    return apiFetch('/user/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }
};