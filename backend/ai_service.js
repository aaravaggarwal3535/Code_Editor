// AI Service for code improvement using Groq API
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configure logging
const logger = {
  debug: console.debug,
  info: console.log,
  error: console.error
};

// Use Groq API key
const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error("No GROQ_API_KEY found in environment variables. Please add it to your .env file.");
}

// Initialize the Groq client
const groqClient = new Groq({ apiKey: groqApiKey });

// Select the model to use
const MODEL_NAME = "llama3-70b-8192";  // Groq's Llama 3 70B model - high quality, fast inferences

// Create a global variable to store the server reference
let server = null;
let keepAliveTimer = null;

// Test the API connection
async function testGroqApi() {
  try {
    console.log("Testing Groq API connection...");
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello" }
      ],
      temperature: 0.2,
      max_tokens: 100
    });
    
    console.log(`Groq API test succeeded: ${response.choices[0].message.content}`);
    if (response.usage.completion_time) {
      console.log(`Response completion time: ${response.usage.completion_time}s`);
    }
    return true;
  } catch (e) {
    console.error(`ERROR initializing Groq API: ${e.message}`);
    console.error(e.stack);
    throw new Error(`Failed to initialize Groq API: ${e.message}`);
  }
}

// Function to keep the server alive
function startKeepAlive() {
  // Don't create a new timer if one already exists
  if (keepAliveTimer) return;
  
  // Print a message that the server is still running every minute
  keepAliveTimer = setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] AI service is still running...`);
    
    // Check if we should clean up sessions
    const now = new Date();
    if ((now - LAST_CLEANUP_TIME) > SESSION_CLEANUP_INTERVAL) {
      cleanupExpiredSessions();
      LAST_CLEANUP_TIME = now;
    }
  }, 60 * 1000); // Every minute
  
  console.log("Keep-alive timer started to maintain server process");
}

// Create the express app
const app = express();

// Configure CORS
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["*"],
  allowedHeaders: ["*"]
}));

// Parse JSON request bodies
app.use(express.json());

// Define in-memory session storage (for production, use a database)
const sessions = {};

// Session cleanup interval (in milliseconds)
const SESSION_CLEANUP_INTERVAL = 3600 * 1000;  // 1 hour
let LAST_CLEANUP_TIME = new Date();
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;  // 24 hours of inactivity

// Add process event listeners for graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down AI service gracefully...');
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  if (server) {
    server.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down AI service gracefully...');
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  if (server) {
    server.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Prevent uncaught exceptions from crashing the app
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error(error.stack);
});

// Prevent unhandled promise rejections from crashing the app
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// Session management functions
function getOrCreateSession(sessionId = null) {
  // Check if we should clean up old sessions
  const now = new Date();
  if ((now - LAST_CLEANUP_TIME) > SESSION_CLEANUP_INTERVAL) {
    cleanupExpiredSessions();
    LAST_CLEANUP_TIME = now;
  }
  
  // If session_id provided and exists, return it
  if (sessionId && sessions[sessionId]) {
    // Update last activity
    sessions[sessionId].last_activity = now;
    return sessionId;
  }
  
  // Otherwise create a new session
  const newSessionId = uuidv4();
  sessions[newSessionId] = {
    created_at: now,
    last_activity: now,
    message_history: [
      {
        role: "system", 
        content: `You are an expert programmer focusing on improving code.
          You provide clear, detailed explanations of your changes.
          You focus on making code more readable, maintainable, efficient,
          and following best practices for the language.`
      }
    ],
    code_history: []
  };
  return newSessionId;
}

function cleanupExpiredSessions() {
  const now = new Date();
  const expiredSessions = [];
  
  for (const sessionId in sessions) {
    if ((now - sessions[sessionId].last_activity) > SESSION_EXPIRY) {
      expiredSessions.push(sessionId);
    }
  }
  
  for (const sessionId of expiredSessions) {
    delete sessions[sessionId];
  }
  
  if (expiredSessions.length) {
    console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
  }
}

// API Endpoints
app.post('/ai/improve', async (req, res) => {
  try {
    const { code, language, prompt, session_id } = req.body;
    
    // Get or create a session
    const sessionId = getOrCreateSession(session_id);
    const session = sessions[sessionId];
    
    console.log(`Processing code improvement: session=${sessionId}, language=${language}, prompt=${prompt}`);
    
    // Add the current code to history
    const codeEntry = {
      timestamp: new Date().toISOString(),
      language,
      code,
      prompt
    };
    session.code_history.push(codeEntry);
    
    // Prepare context from previous interactions
    let context = "";
    if (session.code_history.length > 1) {
      // Include information about previous changes
      const prevEntries = session.code_history.slice(-2);  // Get last 2 entries (excluding current)
      prevEntries.forEach((entry, i) => {
        context += `Previous code version ${i+1}:\n\`\`\`${entry.language}\n${entry.code}\n\`\`\`\n`;
        context += `Previous request: ${entry.prompt}\n\n`;
      });
    }
    
    // Create a prompt for the Groq model
    const systemPrompt = `
      You are an expert programmer focusing on improving code. 
      When asked to improve code, you will:
      1. Maintain the same general functionality unless explicitly asked for changes
      2. Make the code more efficient, readable, or maintainable as appropriate
      3. Add comments to explain complex parts
      4. First provide ONLY the improved code without any explanation or markdown formatting
      5. Then on a new line write "EXPLANATION:" followed by your explanation of the changes
      
      Do not include any additional text before or after these two parts.
    `;
    
    const userPrompt = `
      ${context}
      
      Please improve this ${language} code according to these requirements:
      
      ${prompt}
      
      Here is the code to improve:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Remember to structure your response with the improved code first, followed by "EXPLANATION:" and then your explanation.
    `;
    
    // Add the user request to the message history
    session.message_history.push({ role: "user", content: userPrompt });
    
    // Keep message history to a reasonable size (last 10 messages)
    if (session.message_history.length > 12) {  // system + 10 exchanges + current
      session.message_history = [session.message_history[0]].concat(session.message_history.slice(-11));
    }
    
    console.log("Sending request to Groq API with message history...");
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: session.message_history,
      temperature: 0.2,
      max_tokens: 4000,
    });
    
    const result = response.choices[0].message.content;
    console.log(`Received response from Groq API. Length: ${result.length} characters`);
    if (response.usage.completion_time) {
      console.log(`Response completion time: ${response.usage.completion_time}s`);
    }
    
    // Add assistant response to history
    session.message_history.push({ role: "assistant", content: result });
    
    // Parse the result to separate code and explanation
    let parts = result.split("EXPLANATION:");
    let updatedCode, explanation;
    
    if (parts.length > 1) {
      updatedCode = parts[0].trim();
      explanation = parts[1].trim();
    } else {
      // If no EXPLANATION section, try to guess the separation
      const lines = result.split('\n');
      let codeEndIndex = -1;
      
      // Look for markdown code blocks or natural language transitions
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("```") || lines[i].includes("Here's why:") || lines[i].includes("Explanation:")) {
          codeEndIndex = i;
          break;
        }
      }
      
      if (codeEndIndex > 0) {
        updatedCode = lines.slice(0, codeEndIndex).join('\n').trim();
        explanation = lines.slice(codeEndIndex).join('\n').trim();
      } else {
        // Fallback: assume 80% is code, rest is explanation
        const splitPoint = Math.floor(lines.length * 0.8);
        updatedCode = lines.slice(0, splitPoint).join('\n').trim();
        explanation = lines.slice(splitPoint).join('\n').trim();
      }
    }
    
    // Clean up the code (remove markdown code blocks if present)
    if (updatedCode.startsWith("```")) {
      const codeLines = updatedCode.split('\n');
      // Remove first line with ``` and potentially the language identifier after it
      if (codeLines.length >= 3 && codeLines[0].includes("```")) {
        // Determine where the end of the code block is
        let endIndex = null;
        for (let i = 1; i < codeLines.length; i++) {
          if (codeLines[i].includes("```")) {
            endIndex = i;
            break;
          }
        }
        
        if (endIndex) {
          updatedCode = codeLines.slice(1, endIndex).join('\n');
        } else {
          // No closing marker found, just remove the first line
          updatedCode = codeLines.slice(1).join('\n');
        }
      }
    }
    
    console.log("Successfully processed code improvement request");
    return res.json({
      updated_code: updatedCode,
      explanation: explanation,
      session_id: sessionId
    });
  } catch (e) {
    console.error(`AI processing error: ${e.message}`);
    console.error(e.stack);
    return res.status(500).json({ detail: `AI processing error: ${e.message}` });
  }
});

// Session management endpoints
app.get('/ai/sessions', (req, res) => {
  const sessionList = [];
  for (const sessionId in sessions) {
    sessionList.push({
      session_id: sessionId,
      created_at: sessions[sessionId].created_at.toISOString(),
      last_activity: sessions[sessionId].last_activity.toISOString(),
      message_count: sessions[sessionId].message_history.length,
      code_versions: sessions[sessionId].code_history.length
    });
  }
  return res.json(sessionList);
});

app.get('/ai/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (!sessions[sessionId]) {
    return res.status(404).json({ detail: "Session not found" });
  }
  
  const session = sessions[sessionId];
  return res.json({
    session_id: sessionId,
    created_at: session.created_at.toISOString(),
    last_activity: session.last_activity.toISOString(),
    message_count: session.message_history.length,
    code_versions: session.code_history.length
  });
});

app.get('/ai/session/:sessionId/history', (req, res) => {
  const { sessionId } = req.params;
  if (!sessions[sessionId]) {
    return res.status(404).json({ detail: "Session not found" });
  }
  
  const session = sessions[sessionId];
  return res.json({
    session_id: sessionId,
    message_history: session.message_history,
    code_history: session.code_history
  });
});

app.delete('/ai/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (!sessions[sessionId]) {
    return res.status(404).json({ detail: "Session not found" });
  }
  
  delete sessions[sessionId];
  return res.json({ message: `Session ${sessionId} deleted successfully` });
});

app.get('/test-groq', async (req, res) => {
  try {
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Explain what makes Groq special in 2 sentences." }
      ],
      temperature: 0.2,
      max_tokens: 100
    });
    
    return res.json({
      status: "success",
      message: "Groq API is working",
      response: response.choices[0].message.content,
      completion_time: response.usage?.completion_time,
      model: MODEL_NAME
    });
  } catch (e) {
    return res.json({
      status: "error",
      message: `Failed to connect to Groq API: ${e.message}`,
      traceback: e.stack
    });
  }
});

app.get('/ping', (req, res) => {
  return res.json({ message: "pong" });
});

// Start the server only if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === undefined) {
  // Run as an IIFE (Immediately Invoked Function Expression) to use async/await
  (async () => {
    try {
      // Test the Groq API
      await testGroqApi();
      
      // Create an HTTP server explicitly (more reliable than app.listen)
      const PORT = process.env.AI_PORT || 8001;
      server = http.createServer(app);
      
      // Add error handling for the server
      server.on('error', (error) => {
        console.error(`Server error: ${error.message}`);
        console.error(error.stack);
      });
      
      // Start the server
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`AI service running on port ${PORT}`);
        console.log(`Server started at: ${new Date().toLocaleString()}`);
        console.log(`Press Ctrl+C to stop the service`);
        
        // Start the keep-alive mechanism to prevent the process from exiting
        startKeepAlive();
      });
      
      // This is important: create a permanent reference to prevent garbage collection
      global.server = server;
      
    } catch (error) {
      console.error(`Failed to start AI service: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  })().catch(error => {
    console.error(`Unhandled startup error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });

  // Create a non-clearing interval to keep the Node.js process running
  setInterval(() => {
    // This empty function keeps the event loop active
  }, 1000 * 60 * 60); // Run every hour
}

export default app;