/* eslint-disable */
import mongoose from 'mongoose';

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) return;
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/techmafia';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    connected = true;
    console.log('[DB] MongoDB connected');
  } catch (err: any) {
    console.warn('[DB] MongoDB connection failed. Running in-memory database fallback mode:', err.message);
    connected = false;
  }
}
