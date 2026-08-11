import { GameLog } from '../db/models/GameLog';
import { GameRoom } from '../db/models/GameRoom';

/**
 * Write a chronological game event to MongoDB.
 * Silently swallows errors so a logging failure never crashes the game.
 */
export async function logEvent(
  teamId: string,
  roomCode: string,
  round: number,
  event: string,
  detail?: string
): Promise<void> {
  try {
    await GameLog.create({ teamId, roomCode, round, event, detail });
  } catch (err) {
    console.error('[GameLogger] Failed to write log:', err);
  }
}

/**
 * Update the persistent GameRoom document with new status/metadata.
 */
export async function updateRoomStatus(
  teamId: string,
  update: Partial<{
    status: 'WAITING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED';
    playerNames: string[];
    rounds: number;
    winner: 'CIVILIANS' | 'MAFIA' | null;
    completedAt: Date;
    eliminationHistory: { round: number; playerName: string; role: string }[];
    advancingPlayerNames: string[];
  }>
): Promise<void> {
  try {
    await GameRoom.updateOne({ teamId }, { $set: update });
  } catch (err) {
    console.error('[GameLogger] Failed to update room status:', err);
  }
}
