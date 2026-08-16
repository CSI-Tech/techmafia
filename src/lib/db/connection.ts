/* eslint-disable */
import dns from 'dns';
import mongoose from 'mongoose';

// Force Node.js to use public DNS instead of the localhost proxy (127.0.0.1)
// that Windows sometimes sets, which breaks SRV lookups for MongoDB Atlas.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let connecting = false;

/** Returns true if Mongoose has an active connection. */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Attempt to connect to MongoDB.
 * - If already connected, returns immediately.
 * - If a connection attempt is already in progress, waits for it.
 * - On failure, logs the error and throws (caller decides what to do).
 */
export async function connectMongo(): Promise<void> {
  if (isMongoConnected()) return;
  if (connecting) {
    // Wait for the in-progress attempt instead of launching a parallel one
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
    return;
  }

  connecting = true;
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/techmafia';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('[DB] MongoDB connected');
  } catch (err: any) {
    console.error('[DB] MongoDB connection failed:', err.message);
    throw err;
  } finally {
    connecting = false;
  }
}

// ── Auto-reconnect on unexpected disconnection ──────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected — retrying in 5 s…');
  setTimeout(() => {
    connectMongo().catch((e) =>
      console.error('[DB] Reconnect attempt failed:', e.message)
    );
  }, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] MongoDB reconnected');
});
