// Simple Express server for code execution
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify functions
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'code-execution-backend' });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    name: 'GeistCode Execution API',
    version: '1.0.0'
  });
});

// Simple execute endpoint for JavaScript only initially
app.post('/execute', async (req, res) => {
  const { code, language } = req.body;
  const timestamp = Date.now();
  let filePath;
  let command;

  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    switch (language) {
      case 'javascript':
        try {
          // Execute JavaScript with Node.js
          const result = await execAsync(`node -e "${code.replace(/"/g, '\\"')}"`);
          res.json({ result: result.stdout, error: result.stderr });
        } catch (error) {
          res.json({ result: '', error: error.message });
        }
        break;
      
      case 'python':
        filePath = path.join(tempDir, `code_${timestamp}.py`);
        await writeFileAsync(filePath, code);
        
        try {
          // Try python3 first (most common on cloud platforms)
          command = `python3 "${filePath}"`;
          console.log(`Executing Python with command: ${command}`);
          
          const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
          
          // Clean up the file
          try {
            await unlinkAsync(filePath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (pythonError) {
          try {
            // Fall back to 'python' if 'python3' fails
            command = `python "${filePath}"`;
            console.log(`Falling back to: ${command}`);
            
            const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
            
            // Clean up the file
            try {
              await unlinkAsync(filePath);
            } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
            }
            
            return res.json({ result: stdout, error: stderr });
          } catch (error) {
            console.error('Python execution error:', error);
            return res.json({ 
              result: '', 
              error: 'Failed to execute Python code. Please make sure Python is installed on the server. Error: ' + error.message 
            });
          }
        }
        break;

      default:
        // For other languages, return a message that it's not supported yet
        res.json({ 
          result: '', 
          error: `Language "${language}" is not yet supported in the deployed version.` 
        });
    }
  } catch (error) {
    console.error('Execution error:', error);
    res.json({ result: '', error: error.message });
  }
});

// Proxy the AI requests
app.post('/ai/improve', async (req, res) => {
  try {
    const { code, language, prompt, session_id } = req.body;
    
    console.log(`Processing AI request for language: ${language}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Code length: ${code.length} characters`);
    
    // Check if we're using an external AI service or implementing it directly
    // First attempt: try implementing the AI functionality directly
    
    // Import the Groq SDK if needed
    let Groq;
    try {
      Groq = (await import('groq-sdk')).default;
    } catch (error) {
      console.error('Failed to import Groq SDK:', error);
      return res.status(500).json({
        error: 'AI service dependencies not available',
        details: 'The server is not properly configured for AI processing'
      });
    }
    
    // Check for API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('No GROQ_API_KEY found in environment variables');
      return res.status(500).json({
        error: 'Missing API key',
        details: 'The GROQ_API_KEY environment variable is not set'
      });
    }
    
    // Initialize Groq client
    const groqClient = new Groq({ apiKey: groqApiKey });
    const MODEL_NAME = "llama3-70b-8192";  // Groq's Llama 3 70B model
    
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
    
    console.log("Sending request to Groq API...");
    const response = await groqClient.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.2,
      max_tokens: 4000,
    });
    
    const result = response.choices[0].message.content;
    console.log(`Received response from Groq API. Length: ${result.length} characters`);
    
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
      session_id: session_id || 'new_session'
    });
    
  } catch (error) {
    console.error('AI service error:', error.message);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    
    res.status(500).json({
      error: 'Failed to process with AI service',
      details: error.response?.data?.detail || error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});