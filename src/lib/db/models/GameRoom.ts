import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEliminationEntry {
  round: number;
  playerName: string;
  role: string;
}

export interface IGameRoom extends Document {
  teamId: string;
  roomCode: string;
  teamNumber: string;
  status: 'WAITING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  completedAt?: Date;
  winner?: 'CIVILIANS' | 'MAFIA' | null;
  rounds: number;
  playerNames: string[];
  eliminationHistory: IEliminationEntry[];
  advancingPlayerNames: string[];
}

const EliminationEntrySchema = new Schema<IEliminationEntry>({
  round: { type: Number, required: true },
  playerName: { type: String, required: true },
  role: { type: String, required: true },
}, { _id: false });

const GameRoomSchema = new Schema<IGameRoom>({
  teamId: { type: String, required: true, unique: true, index: true },
  roomCode: { type: String, required: true, unique: true, index: true },
  teamNumber: { type: String, required: true },
  status: { type: String, enum: ['WAITING', 'READY', 'IN_PROGRESS', 'COMPLETED'], default: 'WAITING' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  winner: { type: String, enum: ['CIVILIANS', 'MAFIA', null] },
  rounds: { type: Number, default: 0 },
  playerNames: [{ type: String }],
  eliminationHistory: [EliminationEntrySchema],
  advancingPlayerNames: [{ type: String }],
});

export const GameRoom: Model<IGameRoom> =
  mongoose.models.GameRoom ?? mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);
