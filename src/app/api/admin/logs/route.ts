import { NextResponse } from 'next/server';
import { GameLog } from '@/lib/db/models/GameLog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const roomCode = searchParams.get('roomCode');
    const event = searchParams.get('event');
    const round = searchParams.get('round');

    const filter: Record<string, unknown> = {};
    if (teamId) filter.teamId = teamId;
    if (roomCode) filter.roomCode = roomCode;
    if (event) filter.event = { $regex: event, $options: 'i' };
    if (round) filter.round = Number(round);

    const logs = await GameLog.find(filter).sort({ timestamp: -1 }).limit(500).lean();
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
