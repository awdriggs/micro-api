export function setupHeartbeat(wss, interval = 30000) {
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('Terminating dead connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, interval);

  // Clean up heartbeat on server close
  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return heartbeat;
}
