/* eslint-disable */
import dns from 'dns';
import mongoose from 'mongoose';

// Force Node.js to use public DNS instead of the localhost proxy (127.0.0.1)
// that Windows sometimes sets, which breaks SRV lookups for MongoDB Atlas.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) return;
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/techmafia';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log('[DB] MongoDB connected');
  } catch (err: any) {
    console.error('[DB] MongoDB connection failed:', err.message);
    connected = false;
    throw err;
  }
}

