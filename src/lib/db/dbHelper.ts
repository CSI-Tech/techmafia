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
  if (mongoose.connection.readyState === 1) {
    try {
      return await GameRoom.find(filter).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.error('[DBHelper] MongoDB read failed, using memory:', e);
    }
  }
  let list = Array.from(globalMemoryRooms.values());
  if (filter.status) {
    list = list.filter(r => r.status === filter.status);
  }
  if (filter.roomCode) {
    list = list.filter(r => r.roomCode === filter.roomCode);
  }
  if (filter.teamId) {
    list = list.filter(r => r.teamId === filter.teamId);
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRoom(teamId: string): Promise<any | null> {
  if (mongoose.connection.readyState === 1) {
    try {
      return await GameRoom.findOne({ teamId }).lean();
    } catch (e) {
      console.error('[DBHelper] MongoDB findOne failed, using memory:', e);
    }
  }
  return globalMemoryRooms.get(teamId) || null;
}

export async function createRoom(data: any): Promise<any> {
  const roomData = {
    ...data,
    createdAt: new Date(),
    rounds: data.rounds || 0,
    playerNames: data.playerNames || [],
    eliminationHistory: data.eliminationHistory || [],
    advancingPlayerNames: data.advancingPlayerNames || [],
    playerRoles: data.playerRoles || [],
  };

  if (mongoose.connection.readyState === 1) {
    try {
      return await GameRoom.create(roomData);
    } catch (e) {
      console.error('[DBHelper] MongoDB create failed, using memory:', e);
    }
  }
  globalMemoryRooms.set(data.teamId, roomData);
  return roomData;
}

export async function updateRoom(teamId: string, update: any): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    try {
      await GameRoom.updateOne({ teamId }, { $set: update });
      return;
    } catch (e) {
      console.error('[DBHelper] MongoDB updateOne failed, using memory:', e);
    }
  }
  const existing = globalMemoryRooms.get(teamId) || {};
  globalMemoryRooms.set(teamId, { 
    ...existing, 
    ...update, 
    completedAt: update.completedAt || existing.completedAt 
  });
}

export async function getLogs(filter: any = {}): Promise<any[]> {
  if (mongoose.connection.readyState === 1) {
    try {
      // If round is passed, convert to number
      const mongoFilter: any = { ...filter };
      if (mongoFilter.round) mongoFilter.round = Number(mongoFilter.round);
      return await GameLog.find(mongoFilter).sort({ timestamp: -1 }).limit(500).lean();
    } catch (e) {
      console.error('[DBHelper] MongoDB log read failed, using memory:', e);
    }
  }
  let list = [...globalMemoryLogs];
  if (filter.teamId) {
    const tid = typeof filter.teamId === 'object' && filter.teamId.$regex ? filter.teamId.$regex : filter.teamId;
    list = list.filter(l => l.teamId.toLowerCase().includes(tid.toLowerCase()));
  }
  if (filter.roomCode) {
    const rc = typeof filter.roomCode === 'object' && filter.roomCode.$regex ? filter.roomCode.$regex : filter.roomCode;
    list = list.filter(l => l.roomCode.toLowerCase().includes(rc.toLowerCase()));
  }
  if (filter.round) {
    list = list.filter(l => l.round === Number(filter.round));
  }
  if (filter.event) {
    const ev = typeof filter.event === 'object' && filter.event.$regex ? filter.event.$regex : filter.event;
    list = list.filter(l => l.event.toLowerCase().includes(ev.toLowerCase()));
  }
  return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 500);
}

export async function createLog(data: any): Promise<void> {
  const logData = {
    ...data,
    timestamp: new Date(),
  };
  if (mongoose.connection.readyState === 1) {
    try {
      await GameLog.create(logData);
      return;
    } catch (e) {
      console.error('[DBHelper] MongoDB log create failed, using memory:', e);
    }
  }
  globalMemoryLogs.push(logData);
}
