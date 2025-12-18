import mongoose from 'mongoose';

export async function connectToDatabase(mongoURI) {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err;
  }
}
