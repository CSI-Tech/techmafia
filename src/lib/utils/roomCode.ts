import { GameRoom } from '../db/models/GameRoom';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * Generates a 6-character room code that does not already exist in MongoDB.
 */
export async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode();
    const existing = await GameRoom.findOne({ roomCode: code });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique room code after 20 attempts');
}
