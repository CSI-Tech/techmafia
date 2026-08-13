/* eslint-disable */
import { NextResponse } from 'next/server';
import { getRoom, createRoom, saveTeamLiveState } from '@/lib/db/dbHelper';
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

    const existing = await getRoom(teamId);
    if (existing) {
      return NextResponse.json({ success: false, message: 'A team with this ID already exists' }, { status: 409 });
    }

    const room = await createRoom({
      teamId,
      roomCode,
      teamNumber: teamNumber.trim(),
      status: 'WAITING',
    });

    const team = gameManager.getOrCreateTeam(teamId, roomCode);
    await saveTeamLiveState(teamId, team);

    // Broadcast team creation to all active admin clients
    const globalForSockets = global as unknown as { adminNs?: any };
    if (globalForSockets.adminNs) {
      globalForSockets.adminNs.emit('adminTeamUpdate', {
        teamId,
        roomCode,
        currentState: 'WAITING_FOR_PLAYERS',
        currentRound: 1,
        timerEndsAt: null,
        winner: null,
        players: [],
        aliveCount: 0,
        deadCount: 0,
        eliminatedThisRound: null,
        eliminatedRoleThisRound: null,
        advancingPlayers: [],
      });
    }

    return NextResponse.json({ success: true, teamId, roomCode, team: room });
  } catch (err) {
    console.error('[Admin] generate team error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
