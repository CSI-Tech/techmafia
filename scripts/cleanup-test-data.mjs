import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function runCleanup() {
  if (!uri) {
    console.error('[Cleanup] MONGODB_URI not found');
    process.exit(1);
  }

  console.log('[Cleanup] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('[Cleanup] Connected to MongoDB');

  const GameRoom = mongoose.model('GameRoom', new mongoose.Schema({}, { strict: false }), 'gamerooms');
  const GameLog = mongoose.model('GameLog', new mongoose.Schema({}, { strict: false }), 'gamelogs');

  // Find all existing rooms
  const allRooms = await GameRoom.find({}).lean();
  console.log(`[Cleanup] Total rooms found before cleanup: ${allRooms.length}`);

  // Confirmed test room IDs based on inspection:
  // Records with test player names (u1, u2, p1, p2, player1...) or test team IDs generated during testing
  const testTeamIds = [
    'TEAMTEST1',
    'TEAM02',
    'TEAM03',
    'T1',
    'TEAM4',
    'TE3',
    'T3',
    'T11',
    'T10',
    'TEAM12',
    'T123',
    'TE123',
    'T001',
    'TEAM123',
    'T1234',
    'T05'
  ];

  console.log('\n[Cleanup] Identifying test records to delete:');
  const roomsToDelete = allRooms.filter(r => testTeamIds.includes(r.teamId));

  roomsToDelete.forEach((r, i) => {
    console.log(`  [${i+1}] teamId="${r.teamId}", roomCode="${r.roomCode}", teamNumber="${r.teamNumber}", players=[${(r.playerNames||[]).join(', ')}]`);
  });

  if (roomsToDelete.length === 0) {
    console.log('[Cleanup] No test records found to delete.');
  } else {
    // Delete test GameRooms
    const deleteRoomRes = await GameRoom.deleteMany({ teamId: { $in: testTeamIds } });
    console.log(`\n[Cleanup] Deleted ${deleteRoomRes.deletedCount} test GameRoom records.`);

    // Delete associated test GameLogs
    const deleteLogRes = await GameLog.deleteMany({ teamId: { $in: testTeamIds } });
    console.log(`[Cleanup] Deleted ${deleteLogRes.deletedCount} associated GameLog records.`);
  }

  // Verification
  const remainingRooms = await GameRoom.countDocuments();
  const remainingLogs = await GameLog.countDocuments();
  console.log(`\n[Cleanup Verification] Remaining GameRooms: ${remainingRooms}`);
  console.log(`[Cleanup Verification] Remaining GameLogs: ${remainingLogs}`);

  await mongoose.disconnect();
  console.log('[Cleanup] Done.');
}

runCleanup().catch((err) => {
  console.error('[Cleanup Error]:', err);
  process.exit(1);
});
