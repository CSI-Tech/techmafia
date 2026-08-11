import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGameLog extends Document {
  teamId: string;
  roomCode: string;
  round: number;
  event: string;
  detail?: string;
  timestamp: Date;
}

const GameLogSchema = new Schema<IGameLog>({
  teamId: { type: String, required: true, index: true },
  roomCode: { type: String, required: true, index: true },
  round: { type: Number, default: 0 },
  event: { type: String, required: true },
  detail: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const GameLog: Model<IGameLog> =
  mongoose.models.GameLog ?? mongoose.model<IGameLog>('GameLog', GameLogSchema);
