import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/db/dbHelper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const roomCode = searchParams.get('roomCode');
    const event = searchParams.get('event');
    const round = searchParams.get('round');
    const stage = searchParams.get('stage');
    const player = searchParams.get('player');
    const date = searchParams.get('date');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (teamId) filter.teamId = { $regex: teamId, $options: 'i' };
    if (roomCode) filter.roomCode = { $regex: roomCode, $options: 'i' };
    if (event) filter.event = { $regex: event, $options: 'i' };
    if (round) filter.round = Number(round);
    if (stage) filter.event = { $regex: stage, $options: 'i' };
    if (player) {
      filter.$or = [
        { event: { $regex: player, $options: 'i' } },
        { detail: { $regex: player, $options: 'i' } }
      ];
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    const logs = await getLogs(filter);
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
