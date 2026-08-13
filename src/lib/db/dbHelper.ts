/* eslint-disable */
import { GameRoom } from './models/GameRoom';
import { GameLog } from './models/GameLog';
import mongoose from 'mongoose';

// In-memory global store fallbacks to handle "No MongoDB" mode gracefully
const globalForDb = global as unknown as {
  globalMemoryRooms?: Map<string, any>;
  globalMemoryLogs?: any[];
};

export const globalMemoryRooms = globalForDb.globalMemoryRooms ?? new Map<string, any>();
export const globalMemoryLogs = globalForDb.globalMemoryLogs ?? [];

if (process.env.NODE_ENV !== 'production') {
  globalForDb.globalMemoryRooms = globalMemoryRooms;
  globalForDb.globalMemoryLogs = globalMemoryLogs;
}

export async function getRooms(filter: any = {}): Promise<any[]> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  return await GameRoom.find(filter).sort({ createdAt: -1 }).lean();
}

export async function getRoom(teamId: string): Promise<any | null> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  return await GameRoom.findOne({ teamId }).lean();
}

export async function createRoom(data: any): Promise<any> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  const roomData = {
    ...data,
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
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  await GameRoom.updateOne({ teamId }, { $set: update });
}

export async function getLogs(filter: any = {}): Promise<any[]> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  const mongoFilter: any = { ...filter };
  if (mongoFilter.round) mongoFilter.round = Number(mongoFilter.round);
  return await GameLog.find(mongoFilter).sort({ timestamp: -1 }).limit(500).lean();
}

export async function createLog(data: any): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  const logData = {
    ...data,
    timestamp: new Date(),
  };
  await GameLog.create(logData);
}

export async function saveTeamLiveState(teamId: string, teamState: any): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not active');
  }
  await GameRoom.updateOne({ teamId }, { $set: { liveState: teamState } });
}
