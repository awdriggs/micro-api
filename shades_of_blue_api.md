# Shades of Blue API - GET Route Plan

## Route: `GET /api/readings/:dbName`

Flexible endpoint for reading sensor data from any project database.

### URL Params
- `:dbName` — the MongoDB database name (e.g., `shades-of-blue`)

### Query Params
- `limit` — number of readings to return (default: 50, no cap)
- `before` — ISO timestamp, return readings before this time
- `after` — ISO timestamp, return readings after this time

### Behavior
- Checks if the database exists via `listDatabases()`, returns 404 if not
- Uses raw `collection('sensor_data')` instead of a Mongoose model so it works across projects with different schemas
- Sorts by `timestamp` descending (newest first)
- If fewer documents exist than the requested limit, MongoDB just returns what it has — `count` in the response tells the client how many came back

### Example Usage
```
GET /api/readings/shades-of-blue
GET /api/readings/shades-of-blue?limit=10
GET /api/readings/shades-of-blue?after=2026-02-15T00:00:00Z&limit=1000
GET /api/readings/shades-of-blue?before=2026-02-16T00:00:00Z&after=2026-02-15T00:00:00Z
```

### Response Shape
```json
{
  "database": "shades-of-blue",
  "count": 50,
  "readings": [ ... ]
}
```

### Frontend Pagination
No special server-side pagination needed. Use `before` as a cursor:
```js
const res = await fetch('/api/readings/shades-of-blue?limit=1000');
const data = await res.json();
const oldest = data.readings[data.readings.length - 1].timestamp;
const res2 = await fetch(`/api/readings/shades-of-blue?limit=1000&before=${oldest}`);
```
When `count < limit`, the client has reached the end of the data.

### Route Code
```js
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

    const db = mongoose.connection.useDb(dbName);
    const collection = db.collection('sensor_data');
    const readings = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray();

    res.json({ database: dbName, count: readings.length, readings });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});
```
