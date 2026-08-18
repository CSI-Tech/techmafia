/* eslint-disable */
import { GameRoom } from './models/GameRoom';
import { GameLog } from './models/GameLog';
import mongoose from 'mongoose';
import { connectMongo } from './connection';

/** Ensure DB is connected before running any query. */
async function ensureConnected(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await connectMongo();
  }
}

// In-memory global store fallbacks to handle "No MongoDB" mode gracefully
const globalForDb = global as unknown as {
  globalMemoryRooms?: Map<string, any>;
  globalMemoryLogs?: any[];
};

export const globalMemoryRooms = globalForDb.globalMemoryRooms ?? new Map<string, any>();
export const globalMemoryLogs = globalForDb.globalMemoryLogs ?? [];

globalForDb.globalMemoryRooms = globalMemoryRooms;
globalForDb.globalMemoryLogs = globalMemoryLogs;

export async function getRooms(filter: any = {}): Promise<any[]> {
  await ensureConnected();
  return await GameRoom.find(filter).sort({ createdAt: -1 }).lean();
}

export async function getRoom(teamId: string): Promise<any | null> {
  await ensureConnected();
  return await GameRoom.findOne({ teamId }).lean();
}

export async function getRoomByLoginCode(code: string): Promise<any | null> {
  await ensureConnected();
  const cleanCode = code.trim().toUpperCase();
  const cleanId = cleanCode.replace(/\s+/g, '');
  return await GameRoom.findOne({
    $or: [
      { loginCode: cleanCode },
      { roomCode: cleanCode },
      { teamId: cleanId },
      { teamNumber: cleanCode },
      { teamNumber: new RegExp(`^${cleanCode}$`, 'i') }
    ]
  }).lean();
}

export async function createRoom(data: any): Promise<any> {
  await ensureConnected();
  const roomData = {
    ...data,
    loginCode: data.loginCode || data.roomCode,
    maxPlayers: data.maxPlayers || 8,
    createdAt: new Date(),
    rounds: data.rounds || 0,
    playerNames: data.playerNames || [],
    eliminationHistory: data.eliminationHistory || [],
    advancingPlayerNames: data.advancingPlayerNames || [],
    playerRoles: data.playerRoles || [],
  };
  return await GameRoom.create(roomData);
}

export async function updateRoom(teamId: string, update: any): Promise<void> {
  await ensureConnected();
  await GameRoom.updateOne({ teamId }, { $set: update });
}

export async function getLogs(filter: any = {}): Promise<any[]> {
  await ensureConnected();
  const mongoFilter: any = { ...filter };
  if (mongoFilter.round) mongoFilter.round = Number(mongoFilter.round);
  return await GameLog.find(mongoFilter).sort({ timestamp: -1 }).limit(500).lean();
}

export async function createLog(data: any): Promise<void> {
  await ensureConnected();
  const logData = {
    ...data,
    timestamp: new Date(),
  };
  await GameLog.create(logData);
}

export async function saveTeamLiveState(teamId: string, teamState: any): Promise<void> {
  await ensureConnected();
  await GameRoom.updateOne({ teamId }, { $set: { liveState: teamState } });
}

export async function deleteRoom(teamId: string): Promise<void> {
  await ensureConnected();
  await GameRoom.deleteOne({ teamId });
  await GameLog.deleteMany({ teamId });
}

export async function revokeAllRooms(): Promise<void> {
  await ensureConnected();
  await GameRoom.deleteMany({});
  await GameLog.deleteMany({});
}
