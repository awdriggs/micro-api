import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database.js';
import { StreamManager } from './websocket/StreamManager.js';
import { getProjectHandlers } from './websocket/handlers.js';
import { setupConnectionHandler } from './websocket/connectionHandler.js';
import { setupHeartbeat } from './websocket/heartbeat.js';
import { setupRoutes } from './routes/index.js';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Initialize stream manager
const streamManager = new StreamManager();

// Setup components
const projectHandlers = getProjectHandlers(streamManager);
setupConnectionHandler(wss, streamManager, projectHandlers);
setupHeartbeat(wss, HEARTBEAT_INTERVAL);
setupRoutes(app, streamManager);

// Connect to MongoDB
await connectToDatabase(process.env.MONGO_URI);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Heartbeat interval: ${HEARTBEAT_INTERVAL}ms`);
});
