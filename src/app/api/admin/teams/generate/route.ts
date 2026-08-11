import { NextResponse } from 'next/server';
import { GameRoom } from '@/lib/db/models/GameRoom';
import { generateUniqueRoomCode } from '@/lib/utils/roomCode';
import { gameManager } from '@/lib/game/GameManager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamNumber } = body;

    if (!teamNumber?.trim()) {
      return NextResponse.json({ success: false, message: 'teamNumber is required' }, { status: 400 });
    }

    const roomCode = await generateUniqueRoomCode();
    const teamId = teamNumber.trim().toUpperCase().replace(/\s+/g, '');

    const existing = await GameRoom.findOne({ teamId });
    if (existing) {
      return NextResponse.json({ success: false, message: 'A team with this ID already exists' }, { status: 409 });
    }

    const room = await GameRoom.create({
      teamId,
      roomCode,
      teamNumber: teamNumber.trim(),
      status: 'WAITING',
    });

    gameManager.getOrCreateTeam(teamId, roomCode);

    return NextResponse.json({ success: true, teamId, roomCode, team: room });
  } catch (err) {
    console.error('[Admin] generate team error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
