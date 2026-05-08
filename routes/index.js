import mongoose from 'mongoose';

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

  app.get('/api/readings/:dbName', async (req, res) => {
    const { dbName } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    try {
      const admin = mongoose.connection.db.admin();
      const { databases } = await admin.listDatabases();
      const dbExists = databases.some(db => db.name === dbName);

      if (!dbExists) {
        return res.status(404).json({ error: `Database '${dbName}' not found` });
      }

      const query = {};
      if (req.query.before || req.query.after) {
        query.timestamp = {};
        if (req.query.before) query.timestamp.$lt = new Date(req.query.before);
        if (req.query.after) query.timestamp.$gt = new Date(req.query.after);
      }
      if (req.query.device) query.device_id = req.query.device;

      const db = mongoose.connection.useDb(dbName);
      const collection = db.collection('sensor_data');
      const readings = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray();

      res.json({ database: dbName, count: readings.length, readings });
    } catch (error) {
      console.error('Error fetching readings:', error);
      res.status(500).json({ error: 'Failed to fetch readings' });
    }
  });
}
