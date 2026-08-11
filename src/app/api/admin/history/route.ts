import { NextResponse } from 'next/server';
import { GameRoom } from '@/lib/db/models/GameRoom';

export async function GET() {
  try {
    const rooms = await GameRoom.find({ status: 'COMPLETED' })
      .sort({ completedAt: -1 })
      .lean();
    return NextResponse.json({ success: true, history: rooms });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
