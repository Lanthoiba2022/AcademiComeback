import WebSocket from 'ws';
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections and rooms
const connections = new Map(); // userId -> WebSocket
const rooms = new Map(); // roomId -> Set of userIds
const userRooms = new Map(); // userId -> Set of roomIds
const typingUsers = new Map(); // roomId -> Set of typing userIds

// Rate limiting
const rateLimits = new Map(); // userId -> { count: number, resetTime: number }
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // max messages per minute

// Message types
const MESSAGE_TYPES = {
  CHAT: 'chat',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  REACTION: 'reaction',
  REPLY: 'reply',
  FILE_UPLOAD: 'file_upload',
  PRESENCE: 'presence',
  SYSTEM: 'system',
  ERROR: 'error'
};

// Utility functions
function generateMessageId() {
  return crypto.randomUUID();
}

function getTimestamp() {
  return new Date().toISOString();
}

function isRateLimited(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  userLimit.count++;
  return false;
}

function sanitizeMessage(message) {
  // Basic profanity filter (you can expand this)
  const profanityList = ['badword1', 'badword2']; // Add your profanity list
  let sanitized = message;
  
  profanityList.forEach(word => {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '*'.repeat(word.length));
  });
  
  return sanitized;
}

function broadcastToRoom(roomId, message, excludeUserId = null) {
  const roomUsers = rooms.get(roomId);
  if (!roomUsers) return;
  
  const messageStr = JSON.stringify(message);
  
  roomUsers.forEach(userId => {
    if (userId !== excludeUserId) {
      const ws = connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  });
}

function sendToUser(userId, message) {
  const ws = connections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function addUserToRoom(userId, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(userId);
  
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId).add(roomId);
  
  // Notify room about new user
  broadcastToRoom(roomId, {
    type: MESSAGE_TYPES.SYSTEM,
    id: generateMessageId(),
    roomId,
    content: `User joined the room`,
    timestamp: getTimestamp(),
    userId
  });
}

function removeUserFromRoom(userId, roomId) {
  const roomUsers = rooms.get(roomId);
  if (roomUsers) {
    roomUsers.delete(userId);
    if (roomUsers.size === 0) {
      rooms.delete(roomId);
    }
  }
  
  const userRoomSet = userRooms.get(userId);
  if (userRoomSet) {
    userRoomSet.delete(roomId);
    if (userRoomSet.size === 0) {
      userRooms.delete(userId);
    }
  }
  
  // Notify room about user leaving
  broadcastToRoom(roomId, {
    type: MESSAGE_TYPES.SYSTEM,
    id: generateMessageId(),
    roomId,
    content: `User left the room`,
    timestamp: getTimestamp(),
    userId
  });
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const userId = searchParams.get('userId');
  const roomId = searchParams.get('roomId');
  const token = searchParams.get('token');
  
  console.log(`🔗 New WebSocket connection: userId=${userId}, roomId=${roomId}`);
  
  // Validate connection parameters
  if (!userId || !roomId || !token) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      id: generateMessageId(),
      content: 'Invalid connection parameters',
      timestamp: getTimestamp()
    }));
    ws.close();
    return;
  }
  
  // Store connection
  connections.set(userId, ws);
  
  // Add user to room
  addUserToRoom(userId, roomId);
  
  // Send connection confirmation
  sendToUser(userId, {
    type: MESSAGE_TYPES.SYSTEM,
    id: generateMessageId(),
    roomId,
    content: 'Connected to chat room',
    timestamp: getTimestamp()
  });
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Rate limiting
      if (isRateLimited(userId)) {
        sendToUser(userId, {
          type: MESSAGE_TYPES.ERROR,
          id: generateMessageId(),
          content: 'Rate limit exceeded. Please slow down.',
          timestamp: getTimestamp()
        });
        return;
      }
      
      // Validate message structure
      if (!message.type || !message.content) {
        sendToUser(userId, {
          type: MESSAGE_TYPES.ERROR,
          id: generateMessageId(),
          content: 'Invalid message format',
          timestamp: getTimestamp()
        });
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case MESSAGE_TYPES.CHAT:
          handleChatMessage(userId, roomId, message);
          break;
          
        case MESSAGE_TYPES.TYPING_START:
          handleTypingStart(userId, roomId);
          break;
          
        case MESSAGE_TYPES.TYPING_STOP:
          handleTypingStop(userId, roomId);
          break;
          
        case MESSAGE_TYPES.REACTION:
          handleReaction(userId, roomId, message);
          break;
          
        case MESSAGE_TYPES.REPLY:
          handleReply(userId, roomId, message);
          break;
          
        case MESSAGE_TYPES.FILE_UPLOAD:
          handleFileUpload(userId, roomId, message);
          break;
          
        default:
          sendToUser(userId, {
            type: MESSAGE_TYPES.ERROR,
            id: generateMessageId(),
            content: 'Unknown message type',
            timestamp: getTimestamp()
          });
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      sendToUser(userId, {
        type: MESSAGE_TYPES.ERROR,
        id: generateMessageId(),
        content: 'Error processing message',
        timestamp: getTimestamp()
      });
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log(`🔌 WebSocket connection closed: userId=${userId}`);
    
    // Remove user from room
    if (roomId) {
      removeUserFromRoom(userId, roomId);
    }
    
    // Remove typing indicator
    if (roomId) {
      const typingUsersInRoom = typingUsers.get(roomId);
      if (typingUsersInRoom) {
        typingUsersInRoom.delete(userId);
        if (typingUsersInRoom.size === 0) {
          typingUsers.delete(roomId);
        }
      }
    }
    
    // Remove connection
    connections.delete(userId);
    
    // Clean up user rooms
    userRooms.delete(userId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for userId=${userId}:`, error);
    connections.delete(userId);
  });
});

// Message handlers
function handleChatMessage(userId, roomId, message) {
  const sanitizedContent = sanitizeMessage(message.content);
  
  const chatMessage = {
    type: MESSAGE_TYPES.CHAT,
    id: generateMessageId(),
    roomId,
    userId,
    content: sanitizedContent,
    timestamp: getTimestamp(),
    replyTo: message.replyTo || null,
    attachments: message.attachments || []
  };
  
  // Broadcast to room
  broadcastToRoom(roomId, chatMessage, userId);
  
  // Send confirmation to sender
  sendToUser(userId, {
    ...chatMessage,
    status: 'sent'
  });
  
  console.log(`💬 Chat message from ${userId} in room ${roomId}: ${sanitizedContent.substring(0, 50)}...`);
}

function handleTypingStart(userId, roomId) {
  if (!typingUsers.has(roomId)) {
    typingUsers.set(roomId, new Set());
  }
  typingUsers.get(roomId).add(userId);
  
  broadcastToRoom(roomId, {
    type: MESSAGE_TYPES.TYPING_START,
    id: generateMessageId(),
    roomId,
    userId,
    timestamp: getTimestamp()
  }, userId);
}

function handleTypingStop(userId, roomId) {
  const typingUsersInRoom = typingUsers.get(roomId);
  if (typingUsersInRoom) {
    typingUsersInRoom.delete(userId);
    if (typingUsersInRoom.size === 0) {
      typingUsers.delete(roomId);
    }
  }
  
  broadcastToRoom(roomId, {
    type: MESSAGE_TYPES.TYPING_STOP,
    id: generateMessageId(),
    roomId,
    userId,
    timestamp: getTimestamp()
  }, userId);
}

function handleReaction(userId, roomId, message) {
  const reactionMessage = {
    type: MESSAGE_TYPES.REACTION,
    id: generateMessageId(),
    roomId,
    userId,
    messageId: message.messageId,
    reaction: message.reaction,
    timestamp: getTimestamp()
  };
  
  broadcastToRoom(roomId, reactionMessage);
}

function handleReply(userId, roomId, message) {
  const replyMessage = {
    type: MESSAGE_TYPES.REPLY,
    id: generateMessageId(),
    roomId,
    userId,
    content: sanitizeMessage(message.content),
    replyTo: message.replyTo,
    timestamp: getTimestamp()
  };
  
  broadcastToRoom(roomId, replyMessage, userId);
  
  sendToUser(userId, {
    ...replyMessage,
    status: 'sent'
  });
}

function handleFileUpload(userId, roomId, message) {
  const fileMessage = {
    type: MESSAGE_TYPES.FILE_UPLOAD,
    id: generateMessageId(),
    roomId,
    userId,
    fileName: message.fileName,
    fileUrl: message.fileUrl,
    fileSize: message.fileSize,
    fileType: message.fileType,
    timestamp: getTimestamp()
  };
  
  broadcastToRoom(roomId, fileMessage, userId);
  
  sendToUser(userId, {
    ...fileMessage,
    status: 'sent'
  });
}

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connections: connections.size,
      rooms: rooms.size,
      timestamp: getTimestamp()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ WebSocket server shut down gracefully');
      process.exit(0);
    });
  });
});

export { wss, server }; 