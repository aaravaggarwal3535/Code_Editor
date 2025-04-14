# Code Editor Backend

This is the backend for the Code Editor application. It consists of two services:

1. **Express Server** - Handles code execution and proxies AI requests
2. **Groq AI Service** - Provides AI-powered code improvements

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Groq API key (get one from [console.groq.com](https://console.groq.com))

### Installation

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn python-dotenv groq
   ```

3. Configure your Groq API key by updating the `.env` file in the backend directory:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

### Running the Backend

You can start both services with a single command:

```bash
npm run start:all
```

Or run them individually:

1. Start the Express server:
   ```bash
   npm run start:backend
   ```

2. Start the AI service:
   ```bash
   npm run start:ai
   ```

## API Endpoints

### Express Server (port 3001)

- `POST /execute` - Execute code
  - Body: `{ code: string, language: string }`
  - Returns: `{ result: string, error: string }`

- `POST /ai/improve` - Proxy to the AI service
  - Body: `{ code: string, language: string, prompt: string, session_id?: string }`
  - Returns: `{ updated_code: string, explanation: string, session_id: string }`

### AI Service (port 8001)

- `POST /ai/improve` - Improve code with AI
  - Body: `{ code: string, language: string, prompt: string, session_id?: string }`
  - Returns: `{ updated_code: string, explanation: string, session_id: string }`

- `GET /ping` - Health check
  - Returns: `{ message: "pong" }`

- `GET /test-groq` - Test Groq API connection
  - Returns: `{ status: string, message: string, response: string }`

- Various session management endpoints (see FastAPI docs at `/docs`)

## Supported Languages

- JavaScript (Node.js)
- Python
- Java
- C++

## Session Management

The AI service maintains conversation history for improved context-aware code improvements.
Sessions expire after 24 hours of inactivity.