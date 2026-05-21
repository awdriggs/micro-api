import mongoose from 'mongoose';
import { getSensorReadingModel } from '../models/SensorReading.js';

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

  app.post('/api/readings/shades-of-blue', async (req, res) => {
    const { r, g, b, device_id } = req.body;

    if ([r, g, b].some(v => typeof v !== 'number' || v < 0 || v > 255)) {
      return res.status(400).json({ error: 'r, g, b must be numbers between 0 and 255' });
    }

    try {
      const SensorReading = getSensorReadingModel('shades-of-blue');
      const reading = new SensorReading({ values: { r, g, b }, device_id });
      await reading.save();

      streamManager.broadcast('shades-of-blue', {
        type: 'data',
        device_id,
        values: { r, g, b }
      }, null);

      res.status(201).json({ ok: true });
    } catch (err) {
      console.error('Error saving reading:', err);
      res.status(500).json({ error: 'Failed to save reading' });
    }
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
