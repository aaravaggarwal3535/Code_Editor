// simple-ai-service.js
// A very simple AI service that is designed to stay running
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configure logging
const logger = {
  info: console.log,
  error: console.error
};

// Check for Groq API key
const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error("No GROQ_API_KEY found in environment variables. Please add it to your .env file.");
}

// Initialize the Groq client
const groqClient = new Groq({ apiKey: groqApiKey });

// Select the model to use
const MODEL_NAME = "llama3-70b-8192";  // Groq's Llama 3 70B model

// Create express app
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

// Define in-memory session storage
const sessions = {};

// Test the API connection
async function testGroqApi() {
  try {
    logger.info("Testing Groq API connection...");
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello" }
      ],
      temperature: 0.2,
      max_tokens: 100
    });
    
    logger.info(`Groq API test succeeded: ${response.choices[0].message.content}`);
    if (response.usage.completion_time) {
      logger.info(`Response completion time: ${response.usage.completion_time}s`);
    }
    return true;
  } catch (e) {
    logger.error(`ERROR initializing Groq API: ${e.message}`);
    logger.error(e.stack);
    return false;
  }
}

// API endpoint for code improvement
app.post('/ai/improve', async (req, res) => {
  try {
    const { code, language, prompt, session_id } = req.body;
    
    // Simple validation
    if (!code || !language) {
      return res.status(400).json({ detail: "Missing required fields: code and language" });
    }
    
    // Very simple session handling
    const sessionId = session_id || uuidv4();
    
    logger.info(`Processing code improvement: session=${sessionId}, language=${language}`);
    
    // Create a prompt for the Groq model
    const userPrompt = `
      Please improve this ${language} code according to these requirements:
      
      ${prompt}
      
      Here is the code to improve:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      First provide ONLY the improved code without any explanation or markdown formatting.
      Then on a new line write "EXPLANATION:" followed by your explanation of the changes.
    `;
    
    // Call Groq API
    const messages = [
      {
        role: "system", 
        content: "You are an expert programmer focusing on improving code. You provide clear, detailed explanations of your changes."
      },
      { role: "user", content: userPrompt }
    ];
    
    logger.info("Sending request to Groq API...");
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.2,
      max_tokens: 4000,
    });
    
    const result = response.choices[0].message.content;
    logger.info(`Received response from Groq API. Length: ${result.length} characters`);
    
    // Parse the result to separate code and explanation
    let parts = result.split("EXPLANATION:");
    let updatedCode, explanation;
    
    if (parts.length > 1) {
      updatedCode = parts[0].trim();
      explanation = parts[1].trim();
    } else {
      // Simple fallback if no EXPLANATION marker
      const lines = result.split('\n');
      const splitPoint = Math.floor(lines.length * 0.7);
      updatedCode = lines.slice(0, splitPoint).join('\n').trim();
      explanation = lines.slice(splitPoint).join('\n').trim();
    }
    
    // Clean up the code (remove markdown code blocks if present)
    if (updatedCode.startsWith("```")) {
      const codeLines = updatedCode.split('\n');
      // Find start and end of code block
      const startIndex = codeLines.findIndex(line => line.includes("```")) + 1;
      const endIndex = codeLines.slice(startIndex).findIndex(line => line.includes("```")) + startIndex;
      
      if (endIndex > startIndex) {
        updatedCode = codeLines.slice(startIndex, endIndex).join('\n');
      } else {
        updatedCode = codeLines.slice(startIndex).join('\n');
      }
    }
    
    return res.json({
      updated_code: updatedCode,
      explanation: explanation,
      session_id: sessionId
    });
  } catch (e) {
    logger.error(`AI processing error: ${e.message}`);
    logger.error(e.stack);
    return res.status(500).json({ detail: `AI processing error: ${e.message}` });
  }
});

// Health check endpoint
app.get('/ping', (req, res) => {
  return res.json({ message: "pong" });
});

// Test Groq API endpoint
app.get('/test-groq', async (req, res) => {
  const result = await testGroqApi();
  return res.json({
    status: result ? "success" : "error",
    message: result ? "Groq API is working" : "Failed to connect to Groq API"
  });
});

// Start the server
const PORT = process.env.PORT || process.env.AI_PORT || 8001;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Simple AI service running on port ${PORT}`);
  logger.info(`Started at: ${new Date().toLocaleString()}`);
  testGroqApi();
});

// Handle shutdown signals
process.on('SIGINT', () => {
  logger.info('Shutting down AI service...');
  server.close(() => {
    process.exit(0);
  });
});

// This interval is crucial - it keeps the Node.js event loop active
setInterval(() => {
  logger.info(`AI service is still running on port ${PORT}...`);
}, 60 * 1000); // Log every minute