import { WebSocket } from 'ws';

export class StreamManager {
  constructor() {
    this.streams = new Map();
  }

  // Add a client to a stream
  addToStream(streamName, ws) {
    if (!this.streams.has(streamName)) {
      this.streams.set(streamName, new Set());
    }
    this.streams.get(streamName).add(ws);
    ws.currentStream = streamName;
  }

  // Remove a client from their current stream
  removeFromStream(ws) {
    if (!ws.currentStream) return;

    const streamConnections = this.streams.get(ws.currentStream);
    streamConnections?.delete(ws);

    // Clean up empty streams
    if (streamConnections && streamConnections.size === 0) {
      this.streams.delete(ws.currentStream);
      console.log(`Stream ${ws.currentStream} removed (no clients)`);
    }
  }

  // Broadcast message to all clients in a stream except sender
  broadcast(streamName, message, sender) {
    const streamConnections = this.streams.get(streamName);
    if (!streamConnections) return;

    streamConnections.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Get all stream names
  getStreamNames() {
    return Array.from(this.streams.keys());
  }

  // Get stream statistics
  getStreamStats() {
    return Array.from(this.streams.entries()).map(([name, clients]) => ({
      stream: name,
      clients: clients.size
    }));
  }
}
