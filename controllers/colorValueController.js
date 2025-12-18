export function handleColorValue(msg, ws, streams, broadcast) {
  console.log('Color-value handler:', msg);

  // Broadcast to other clients in the stream
  broadcast(streams, ws.currentStream, msg, ws);
}
