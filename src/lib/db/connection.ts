import mongoose from 'mongoose';

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) return;
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/techmafia';
  await mongoose.connect(uri);
  connected = true;
  console.log('[DB] MongoDB connected');
}
