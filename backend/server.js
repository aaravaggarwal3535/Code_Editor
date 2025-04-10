const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const execAsync = promisify(exec);

// Add this function at the top of your file
function isCommandAvailable(command) {
  try {
    execSync(`${command} -version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use(cors());
app.use(bodyParser.json());

// Create a temp directory for code files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.post('/execute', async (req, res) => {
  const { code, language } = req.body;
  const timestamp = Date.now();
  let filePath;
  let command;
  let fileExtension;

  try {
    // Configure file extensions and commands for different languages
    switch (language) {
      case 'javascript':
        fileExtension = 'js';
        filePath = path.join(tempDir, `code_${timestamp}.js`);
        command = `node ${filePath}`;
        break;
      case 'python':
        fileExtension = 'py';
        filePath = path.join(tempDir, `code_${timestamp}.py`);
        command = `python ${filePath}`;
        break;
      case 'java':
        if (!isCommandAvailable('javac')) {
          return res.json({ 
            result: '',
            error: 'Java compiler (javac) not found on this system. Please install Java JDK and make sure it is in your PATH.'
          });
        }
        
        fileExtension = 'java';
        // Extract class name for Java
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        if (!classNameMatch) {
          return res.json({ 
            result: '', 
            error: 'Could not find a public class in your Java code. Make sure you have a "public class ClassName" declaration.' 
          });
        }
        
        const className = classNameMatch[1];
        filePath = path.join(tempDir, `${className}.java`);
        
        // Write the code to a temporary file
        await writeFileAsync(filePath, code);
        
        try {
          // First compile the Java code
          const compileResult = await execAsync(`javac "${filePath}"`, { timeout: 10000 });
          
          if (compileResult.stderr) {
            return res.json({ result: '', error: compileResult.stderr });
          }
          
          // Then run the compiled class file
          const { stdout, stderr } = await execAsync(`java -cp "${tempDir}" ${className}`, { timeout: 10000 });
          
          // Clean up - remove the .java and .class files
          try {
            await unlinkAsync(filePath);
            await unlinkAsync(path.join(tempDir, `${className}.class`));
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          return res.json({ result: stdout, error: stderr });
        } catch (javaError) {
          console.error('Java execution error:', javaError);
          return res.json({ 
            result: '', 
            error: javaError.message || 'Java execution failed'
          });
        }
        break;
      case 'cpp':
        fileExtension = 'cpp';
        filePath = path.join(tempDir, `code_${timestamp}.cpp`);
        const exePath = path.join(tempDir, `code_${timestamp}.exe`);
        command = `g++ ${filePath} -o ${exePath} && ${exePath}`;
        break;
      case 'html':
        // For HTML, we'll return the code itself as it needs to be rendered in browser
        return res.json({ result: code, error: null });
      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // For non-Java languages, continue with the existing code...
    
    // Write the code to a temporary file
    await writeFileAsync(filePath, code);

    // Execute the code
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });

    // Clean up the file
    try {
      await unlinkAsync(filePath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    // Return the result
    res.json({
      result: stdout,
      error: stderr
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.json({
      result: '',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Code execution server running on port ${PORT}`);
});