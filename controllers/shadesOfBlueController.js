import { getSensorReadingModel } from '../models/SensorReading.js';

export async function handleShadesOfBlue(msg, ws, streams, broadcast) {
  console.log("handle shades of blue color value");
  console.log(msg);

  // Save sensor reading to MongoDB
  try {
    const SensorReading = getSensorReadingModel('shades-of-blue'); //specify the database name here as the param!
    const reading = new SensorReading({
      values: msg.values
    });
    await reading.save();
    console.log('Sensor reading saved to database');
  } catch (error) {
    console.error('Error saving sensor reading:', error);
  }

  // Broadcast to other clients in the stream
  broadcast(streams, ws.currentStream, msg, ws);
}
