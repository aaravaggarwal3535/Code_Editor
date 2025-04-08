const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const execAsync = promisify(exec);

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
        fileExtension = 'java';
        // Extract class name for Java
        const className = code.match(/class\s+(\w+)/)?.[1] || 'Main';
        filePath = path.join(tempDir, `${className}.java`);
        command = `javac ${filePath} && java -cp ${tempDir} ${className}`;
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

    // Write the code to a temporary file
    await writeFileAsync(filePath, code);

    // Execute the code
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });

    // Clean up the file
    if (language !== 'java') {
      await unlinkAsync(filePath);
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