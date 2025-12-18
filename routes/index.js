export function setupRoutes(app, streamManager) {
  app.get('/', (req, res) => {
    res.json({
      message: 'WebSocket Proxy Server for Microcontrollers',
      streams: streamManager.getStreamNames(),
      connections: streamManager.getStreamStats()
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
}
