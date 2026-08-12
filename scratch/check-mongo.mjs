/**
 * MongoDB Atlas connection check — forces Node DNS to 8.8.8.8 to bypass localhost proxy.
 * Masks credentials in all output.
 */

// ── Fix: override Node's DNS before anything else ──────────────────────────
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

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

const maskedUri = rawUri.replace(/:\/\/([^:@]+):([^@]+)@/, '://<user>:****@');
console.log(`\n🔍  Connecting to: ${maskedUri.substring(0, 70)}...\n`);
console.log('📡  DNS forced to 8.8.8.8 / 1.1.1.1 (bypass localhost proxy)\n');

try {
  const conn = await mongoose.createConnection(rawUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  }).asPromise();

  const dbName = conn.db?.databaseName ?? '(unknown)';
  const host   = conn.host ?? '(unknown)';

  console.log('✅  MongoDB connection: SUCCESS');
  console.log(`    Database : ${dbName}`);
  console.log(`    Host     : ${host}`);
  console.log('\n✅  Project is ready for MongoDB integration.\n');

  await conn.close();
} catch (err) {
  console.error('❌  MongoDB connection: FAILED');
  console.error(`    Error: ${err.message}`);
  process.exit(1);
}
