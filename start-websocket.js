#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  port: process.env.WS_PORT || 3001,
  host: process.env.WS_HOST || 'localhost',
  logLevel: process.env.LOG_LEVEL || 'info',
  maxConnections: process.env.MAX_CONNECTIONS || 1000,
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || 60000,
  rateLimitMax: process.env.RATE_LIMIT_MAX || 100
};

// Set environment variables
process.env.WS_PORT = config.port.toString();
process.env.WS_HOST = config.host;
process.env.LOG_LEVEL = config.logLevel;
process.env.MAX_CONNECTIONS = config.maxConnections.toString();
process.env.RATE_LIMIT_WINDOW = config.rateLimitWindow.toString();
process.env.RATE_LIMIT_MAX = config.rateLimitMax.toString();

console.log('🚀 Starting StudySync WebSocket Server...');
console.log('📋 Configuration:');
console.log(`   Port: ${config.port}`);
console.log(`   Host: ${config.host}`);
console.log(`   Log Level: ${config.logLevel}`);
console.log(`   Max Connections: ${config.maxConnections}`);
console.log(`   Rate Limit: ${config.rateLimitMax} messages per ${config.rateLimitWindow / 1000}s`);
console.log('');

// Check if websocket-server.js exists
const serverPath = path.join(__dirname, 'websocket-server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ websocket-server.js not found!');
  console.error('Please make sure the WebSocket server file exists.');
  process.exit(1);
}

// Start the WebSocket server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle server process events
server.on('error', (error) => {
  console.error('❌ Failed to start WebSocket server:', error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ WebSocket server exited with code ${code}`);
    process.exit(code);
  } else {
    console.log('✅ WebSocket server stopped gracefully');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  server.kill('SIGTERM');
});

// Health check function
const checkHealth = async () => {
  try {
    const response = await fetch(`http://${config.host}:${config.port}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Health check: ${data.status} - ${data.connections} connections, ${data.rooms} rooms`);
    }
  } catch (error) {
    console.warn('⚠️ Health check failed:', error.message);
  }
};

// Periodic health checks (every 30 seconds)
setInterval(checkHealth, 30000);

console.log('✅ WebSocket server process started');
console.log(`📊 Health check available at http://${config.host}:${config.port}/health`);
console.log('Press Ctrl+C to stop the server'); 