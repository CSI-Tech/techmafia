/**
 * MongoDB Atlas connection check — tries SRV first, then direct hosts as fallback.
 * Masks credentials in all output.
 */
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env.local');

const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const rawUri = process.env.MONGODB_URI;
if (!rawUri) {
  console.error('❌  MONGODB_URI is NOT set in .env.local');
  process.exit(1);
}

// Extract credentials from SRV URI and build direct URI for fallback
const match = rawUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)/);
let directUri = null;
if (match) {
  const [, user, pass, host] = match;
  const baseHost = host; // e.g. mafia-game-cluster.q3aa6qj.mongodb.net
  // Use the actual shard hosts discovered from DNS
  directUri = `mongodb://${user}:${pass}@ac-k8e1sag-shard-00-00.q3aa6qj.mongodb.net:27017,ac-k8e1sag-shard-00-01.q3aa6qj.mongodb.net:27017,ac-k8e1sag-shard-00-02.q3aa6qj.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx&authSource=admin&retryWrites=true&w=majority`;
}

const maskedUri = rawUri.replace(/:\/\/([^:@]+):([^@]+)@/, '://<user>:****@');
console.log(`\n🔍  URI present: ${maskedUri.substring(0, 60)}...\n`);
console.log('📡  Attempting SRV connection (8s timeout)...');

async function tryConnect(uri, label) {
  try {
    const conn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    }).asPromise();
    const dbName = conn.db?.databaseName ?? '(unknown)';
    const host = conn.host ?? '(unknown)';
    console.log(`\n✅  MongoDB connection: SUCCESS (${label})`);
    console.log(`    Database : ${dbName}`);
    console.log(`    Host     : ${host}`);
    await conn.close();
    return true;
  } catch (err) {
    console.log(`❌  ${label} FAILED: ${err.message}`);
    return false;
  }
}

let ok = await tryConnect(rawUri, 'SRV');

if (!ok && directUri) {
  console.log('\n📡  Trying direct replicaset connection...');
  ok = await tryConnect(directUri, 'Direct');
}

if (ok) {
  console.log('\n✅  Project is ready for MongoDB integration.\n');
} else {
  console.log('\n❌  Both connection attempts failed. See errors above.\n');
  process.exit(1);
}
