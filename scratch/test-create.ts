/* eslint-disable */
import { connectMongo } from '../src/lib/db/connection';
import { getRoom, createRoom } from '../src/lib/db/dbHelper';
import { generateUniqueRoomCode } from '../src/lib/utils/roomCode';

async function test() {
  console.log('Connecting...');
  await connectMongo();
  
  console.log('Testing generateUniqueRoomCode...');
  try {
    const code = await generateUniqueRoomCode();
    console.log('generateUniqueRoomCode result:', code);
  } catch (e: any) {
    console.error('generateUniqueRoomCode failed:', e.message, e.stack);
  }

  console.log('Testing getRoom...');
  try {
    const existing = await getRoom('TE1');
    console.log('getRoom result:', existing);
  } catch (e: any) {
    console.error('getRoom failed:', e.message, e.stack);
  }

  console.log('Testing createRoom...');
  try {
    const room = await createRoom({
      teamId: 'TE1',
      roomCode: '123456',
      teamNumber: 'TE1',
      status: 'WAITING',
    });
    console.log('createRoom result:', room);
  } catch (e: any) {
    console.error('createRoom failed:', e.message, e.stack);
  }
  
  process.exit(0);
}

test();
