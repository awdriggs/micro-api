export function setupConnectionHandler(wss, streamManager, projectHandlers) {
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
          handleJoinStream(ws, msg, streamManager);
          return;
        }

        // Handle data messages
        if (msg.type === 'data' && ws.currentStream) {
          handleDataMessage(ws, msg, streamManager, projectHandlers);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      streamManager.removeFromStream(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

function handleJoinStream(ws, msg, streamManager) {
  const streamName = msg.stream;

  // Validate stream name exists and is not empty
  if (!streamName || typeof streamName !== 'string' || streamName.trim() === '') {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid stream name' }));
    return;
  }

  // Leave previous stream if any
  if (ws.currentStream) {
    streamManager.removeFromStream(ws);
  }

  // Join new stream
  streamManager.addToStream(streamName, ws);

  console.log(`Client joined stream: ${streamName}`);
  ws.send(JSON.stringify({ type: 'joined', stream: streamName }));
}

function handleDataMessage(ws, msg, streamManager, projectHandlers) {
  const handler = projectHandlers[ws.currentStream];

  if (handler) {
    // Use custom handler if defined
    handler(msg, ws);
  } else {
    // Default behavior: just broadcast
    streamManager.broadcast(ws.currentStream, msg, ws);
  }
}
