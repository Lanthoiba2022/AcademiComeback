#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AcademiComeback Chat System...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Check if running in the correct directory
if (!fs.existsSync('package.json')) {
  logError('Please run this script from the AcademiComeback project root directory');
  process.exit(1);
}

try {
  // Step 1: Install WebSocket dependencies
  logStep(1, 'Installing WebSocket dependencies...');
  execSync('npm install ws@^8.14.2 nodemon@^3.0.1 concurrently@^8.2.2', { stdio: 'inherit' });
  logSuccess('WebSocket dependencies installed');

  // Step 2: Check if environment file exists
  logStep(2, 'Checking environment configuration...');
  const envFile = '.env';
  const envExample = 'env.example';
  
  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExample)) {
      logWarning('No .env file found. Creating from example...');
      fs.copyFileSync(envExample, envFile);
      logSuccess('.env file created from example');
    } else {
      logWarning('No .env file found. Creating basic configuration...');
      const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# WebSocket Configuration
VITE_WS_URL=ws://localhost:3001
WS_PORT=3001
WS_HOST=localhost

# File Storage Configuration
VITE_STORAGE_BUCKET=chat-attachments
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/*,application/pdf,text/*

# Chat Configuration
VITE_ENABLE_PROFANITY_FILTER=true
VITE_RATE_LIMIT_MESSAGES_PER_MINUTE=100
VITE_ENABLE_TYPING_INDICATORS=true
VITE_ENABLE_READ_RECEIPTS=true
VITE_ENABLE_REACTIONS=true
VITE_ENABLE_FILE_UPLOADS=true

# Development Configuration
VITE_DEV_MODE=true
VITE_ENABLE_DEBUG_LOGGING=true
`;
      fs.writeFileSync(envFile, envContent);
      logSuccess('.env file created with basic configuration');
    }
  } else {
    logSuccess('.env file already exists');
  }

  // Step 3: Check if WebSocket server files exist
  logStep(3, 'Checking WebSocket server files...');
  const requiredFiles = [
    'websocket-server.js',
    'start-websocket.js',
    'WEBSOCKET_README.md'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logError(`Missing required files: ${missingFiles.join(', ')}`);
    logWarning('Please ensure all WebSocket server files are present');
  } else {
    logSuccess('All WebSocket server files found');
  }

  // Step 4: Check if database migration exists
  logStep(4, 'Checking database migration...');
  const migrationFile = 'supabase/migrations/20250615070615_chat_features.sql';
  
  if (!fs.existsSync(migrationFile)) {
    logWarning('Database migration file not found');
    logWarning('Please run the migration manually: supabase/migrations/20250615070615_chat_features.sql');
  } else {
    logSuccess('Database migration file found');
  }

  // Step 5: Check if client-side files exist
  logStep(5, 'Checking client-side files...');
  const clientFiles = [
    'src/lib/websocket.ts',
    'src/lib/fileStorage.ts',
    'src/contexts/ChatContext.tsx',
    'src/components/room/ChatArea.tsx'
  ];
  
  const missingClientFiles = clientFiles.filter(file => !fs.existsSync(file));
  
  if (missingClientFiles.length > 0) {
    logWarning(`Missing client-side files: ${missingClientFiles.join(', ')}`);
  } else {
    logSuccess('All client-side files found');
  }

  // Step 6: Test WebSocket server
  logStep(6, 'Testing WebSocket server...');
  try {
    // Check if port 3001 is available
    const net = require('net');
    const server = net.createServer();
    
    server.listen(3001, () => {
      server.close();
      logSuccess('Port 3001 is available for WebSocket server');
    });
    
    server.on('error', () => {
      logWarning('Port 3001 is already in use');
      logWarning('Please stop any existing WebSocket server or change the port');
    });
  } catch (error) {
    logWarning('Could not test port availability');
  }

  // Step 7: Display next steps
  logStep(7, 'Setup complete! Next steps:');
  log('\n📋 Manual Configuration Required:', 'bright');
  log('1. Update .env file with your Supabase credentials', 'yellow');
  log('2. Run database migration: supabase db push', 'yellow');
  log('3. Create storage bucket: chat-attachments', 'yellow');
  log('4. Configure RLS policies in Supabase', 'yellow');
  
  log('\n🚀 Start the application:', 'bright');
  log('• Development mode: npm run dev:full', 'green');
  log('• WebSocket only: npm run websocket', 'green');
  log('• Frontend only: npm run dev', 'green');
  
  log('\n📚 Documentation:', 'bright');
  log('• WebSocket server: WEBSOCKET_README.md', 'blue');
  log('• API reference: Check the README files', 'blue');
  
  log('\n🔧 Troubleshooting:', 'bright');
  log('• Check .env configuration', 'yellow');
  log('• Verify database migration ran successfully', 'yellow');
  log('• Ensure WebSocket server is running on port 3001', 'yellow');
  log('• Check browser console for connection errors', 'yellow');

  logSuccess('Chat system setup completed successfully!');

} catch (error) {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
} 