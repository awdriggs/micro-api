import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

//import all contorller for specific projects with special logic
import { handleColorValue } from './controllers/colorValueController.js';
import { handleShadesOfBlue } from './controllers/shadesOfBlueController.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Secrets
dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Track streams - maps stream name to Set of WebSocket connections
const streams = new Map();

// Broadcast message to all clients in a stream except sender
function broadcast(streams, streamName, message, sender) {
  const streamConnections = streams.get(streamName);
  if (!streamConnections) return;

  streamConnections.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Project-specific handlers
const projectHandlers = {
  'color-value': (msg, ws, streams) => handleColorValue(msg, ws, streams, broadcast),
  'shades-of-blue': (msg, ws, streams) => handleShadesOfBlue(msg, ws, streams, broadcast)
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Initialize heartbeat
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      // Handle joining a stream
      if (msg.type === 'join') {
        const streamName = msg.stream;

        // Validate stream name exists and is not empty
        if (!streamName || typeof streamName !== 'string' || streamName.trim() === '') {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid stream name' }));
          return;
        }

        // Leave previous stream if any
        if (ws.currentStream) {
          streams.get(ws.currentStream)?.delete(ws);
        }

        // Join new stream
        if (!streams.has(streamName)) {
          streams.set(streamName, new Set());
        }
        streams.get(streamName).add(ws);
        ws.currentStream = streamName;

        console.log(`Client joined stream: ${streamName}`);
        ws.send(JSON.stringify({ type: 'joined', stream: streamName }));
        return;
      }

      // Handle data messages
      if (msg.type === 'data' && ws.currentStream) {
        const handler = projectHandlers[ws.currentStream];

        if (handler) {
          // Use custom handler if defined
          handler(msg, ws, streams);
        } else {
          // Default behavior: just broadcast
          broadcast(streams, ws.currentStream, msg, ws);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    // Remove from current stream
    if (ws.currentStream) {
      const streamConnections = streams.get(ws.currentStream);
      streamConnections?.delete(ws);

      // Clean up empty streams
      if (streamConnections && streamConnections.size === 0) {
        streams.delete(ws.currentStream);
        console.log(`Stream ${ws.currentStream} removed (no clients)`);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Express routes
app.get('/', (req, res) => {
  res.json({
    message: 'WebSocket Proxy Server for Microcontrollers',
    streams: Array.from(streams.keys()),
    connections: Array.from(streams.entries()).map(([name, clients]) => ({
      stream: name,
      clients: clients.size
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Heartbeat to keep connections alive
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating dead connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// Clean up heartbeat on server close
wss.on('close', () => {
  clearInterval(heartbeat);
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Heartbeat interval: ${HEARTBEAT_INTERVAL}ms`);
});
