import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
  values: {
    r: {
      type: Number,
      required: true,
      min: 0,
      max: 255
    },
    g: {
      type: Number,
      required: true,
      min: 0,
      max: 255
    },
    b: {
      type: Number,
      required: true,
      min: 0,
      max: 255
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  collection: 'sensor_data' //specify the collection that the data will appear in.
});

// Export a function that returns the model for a specific database
export function getSensorReadingModel(dbName) {
  const db = mongoose.connection.useDb(dbName);
  return db.model('SensorReading', sensorReadingSchema);
}

export default sensorReadingSchema;
