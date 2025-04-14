// Server for code execution
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

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

// Create a temp directory for storing code files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Code execution endpoint
app.post('/execute', async (req, res) => {
  const { code, language } = req.body;
  const timestamp = Date.now();
  let filePath;
  let command;

  try {
    switch (language) {
      case 'javascript':
        filePath = path.join(tempDir, `code_${timestamp}.js`);
        await writeFileAsync(filePath, code);
        command = `node "${filePath}"`;
        break;
      
      case 'python':
        filePath = path.join(tempDir, `code_${timestamp}.py`);
        await writeFileAsync(filePath, code);
        // Try different Python commands for Windows compatibility
        try {
          // First try with 'py' (Python launcher for Windows)
          command = `py "${filePath}"`;
          const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
          
          // Clean up the file
          try {
            await unlinkAsync(filePath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (pyError) {
          try {
            // Fall back to 'python' if 'py' fails
            command = `python "${filePath}"`;
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
              // Try 'python3' as a last resort
              command = `python3 "${filePath}"`;
              const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
              
              // Clean up the file
              try {
                await unlinkAsync(filePath);
              } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
              }
              
              return res.json({ result: stdout, error: stderr });
            } catch (python3Error) {
              return res.json({ 
                result: '', 
                error: 'Failed to execute Python code. Please make sure Python is installed and in your PATH. Error: ' + python3Error.message 
              });
            }
          }
        }
        break;
      
      case 'java':
        // For Java, we need to extract the class name and create a file with that name
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        if (!classNameMatch) {
          return res.json({
            result: '',
            error: 'Could not find a public class in your Java code'
          });
        }
        
        const className = classNameMatch[1];
        filePath = path.join(tempDir, `${className}.java`);
        await writeFileAsync(filePath, code);
        
        try {
          // First compile the Java code
          await execAsync(`javac "${filePath}"`, { timeout: 10000 });
          
          // Then run the compiled class file
          const { stdout, stderr } = await execAsync(`java -cp "${tempDir}" ${className}`, { timeout: 10000 });
          
          // Clean up the files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(path.join(tempDir, `${className}.class`));
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (javaError) {
          return res.json({ result: '', error: javaError.message });
        }
      
      case 'cpp':
        filePath = path.join(tempDir, `code_${timestamp}.cpp`);
        const outputPath = path.join(tempDir, `code_${timestamp}.exe`);
        await writeFileAsync(filePath, code);
        
        try {
          // First compile the C++ code
          await execAsync(`g++ "${filePath}" -o "${outputPath}"`, { timeout: 10000 });
          
          // Then run the compiled executable
          const { stdout, stderr } = await execAsync(`"${outputPath}"`, { timeout: 10000 });
          
          // Clean up the files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(outputPath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (cppError) {
          return res.json({ result: '', error: cppError.message });
        }

      case 'c':
        filePath = path.join(tempDir, `code_${timestamp}.c`);
        const cOutputPath = path.join(tempDir, `code_${timestamp}.exe`);
        await writeFileAsync(filePath, code);
        
        try {
          // First compile the C code
          await execAsync(`gcc "${filePath}" -o "${cOutputPath}"`, { timeout: 10000 });
          
          // Then run the compiled executable
          const { stdout, stderr } = await execAsync(`"${cOutputPath}"`, { timeout: 10000 });
          
          // Clean up the files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(cOutputPath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (cError) {
          return res.json({ result: '', error: cError.message });
        }
      
      default:
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // For JavaScript and Python, execute the command
    if (language === 'javascript' || language === 'python') {
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
      
      // Clean up the file
      try {
        await unlinkAsync(filePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      res.json({ result: stdout, error: stderr });
    }
  } catch (error) {
    console.error('Execution error:', error);
    res.json({ result: '', error: error.message });
  }
});

// Proxy the AI requests to the Groq service
app.post('/ai/improve', async (req, res) => {
  try {
    const { code, language, prompt, session_id } = req.body;
    
    console.log(`Processing AI request for language: ${language}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Code length: ${code.length} characters`);
    console.log(`Session ID: ${session_id || 'new session'}`);
    
    // Use the port where the AI service is running
    const aiPort = process.env.AI_PORT || 8001;
    
    // First check if ping works - Use IPv4 address explicitly
    try {
      console.log('Pinging AI service...');
      await axios.get(`http://127.0.0.1:${aiPort}/ping`);
      console.log('AI service ping successful');
    } catch (pingError) {
      console.error('AI service ping failed:', pingError.message);
      return res.status(503).json({
        error: 'AI service is not running',
        details: 'Unable to connect to the AI service'
      });
    }
    
    // Send to the AI service endpoint with session_id
    console.log('Sending request to AI service...');
    const response = await axios.post(`http://127.0.0.1:${aiPort}/ai/improve`, {
      code,
      language,
      prompt,
      session_id
    });
    
    console.log('AI service response received');
    res.json(response.data);
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
  console.log(`Code execution server running on port ${PORT}`);
});