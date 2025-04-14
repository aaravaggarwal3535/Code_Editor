// keep-alive.js
// Simple script to keep the AI service running continuously
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory with ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting AI service with auto-restart...');

// Function to start the AI service
function startAIService() {
  // Create a child process to run the AI service
  const aiService = spawn('node', ['--no-deprecation', path.join(__dirname, 'ai_service.js')], {
    stdio: 'inherit', // Redirect child process I/O to parent process
    shell: false
  });

  // Handle process exit
  aiService.on('exit', (code, signal) => {
    console.log(`AI service exited with code ${code} and signal ${signal}`);
    console.log('Restarting AI service in 2 seconds...');
    
    // Restart the service after a short delay
    setTimeout(startAIService, 2000);
  });

  // Handle process errors
  aiService.on('error', (err) => {
    console.error('Failed to start AI service:', err);
    console.log('Restarting AI service in 2 seconds...');
    
    // Restart the service after a short delay
    setTimeout(startAIService, 2000);
  });
}

// Start the AI service
startAIService();

// Handle process signals to properly shut down
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  process.exit(0);
});