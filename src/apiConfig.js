// API Configuration for external services
const API_CONFIG = {
  // Backend API URL - hardcoded based on environment
  LOCAL_API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' // Development environment
    : 'https://code-editor-backend-production.up.railway.app', // Production environment
  
  // External code execution APIs
  EXTERNAL_APIS: {
    // Judge0 - API for executing code
    JUDGE0: {
      URL: 'https://judge0-ce.p.rapidapi.com',
      HEADERS: {
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY', // Replace with your actual key when needed
        'Content-Type': 'application/json'
      },
      ENDPOINTS: {
        SUBMISSIONS: '/submissions',
        SUBMISSION_DETAILS: '/submissions/'
      },
      LANGUAGE_IDS: {
        python: 71,    // Python 3.8
        java: 62,      // Java JDK 11
        cpp: 54,       // C++ GCC 9.2
        c: 50          // C GCC 9.2
      }
    },
    
    // JDoodle - Alternative API for code execution
    JDOODLE: {
      URL: 'https://api.jdoodle.com/v1/execute',
      LANGUAGE_CONFIG: {
        python: { language: 'python3', versionIndex: '3' },
        java: { language: 'java', versionIndex: '0' },
        cpp: { language: 'cpp17', versionIndex: '0' },
        c: { language: 'c', versionIndex: '4' }
      }
    },
    
    // Programiz - Web-based Online Compiler
    PROGRAMIZ: {
      URL: 'https://www.programiz.com/python-programming/online-compiler/',
      URLS: {
        python: 'https://www.programiz.com/python-programming/online-compiler/',
        java: 'https://www.programiz.com/java-programming/online-compiler/',
        cpp: 'https://www.programiz.com/cpp-programming/online-compiler/',
        c: 'https://www.programiz.com/c-programming/online-compiler/'
      }
    }
  }
};

export default API_CONFIG;