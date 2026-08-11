import { NextResponse } from 'next/server';
import { GameRoom } from '@/lib/db/models/GameRoom';
import { gameManager } from '@/lib/game/GameManager';

export async function GET() {
  try {
    const rooms = await GameRoom.find().sort({ createdAt: -1 }).lean();

    const teamsWithLive = rooms.map((room) => {
      const live = gameManager.getTeam(room.teamId);
      return {
        ...room,
        live: live
          ? {
              currentState: live.currentState,
              currentRound: live.currentRound,
              timerEndsAt: live.timerEndsAt,
              playerCount: live.players.length,
              aliveCount: live.players.filter((p) => p.status === 'ALIVE').length,
              deadCount: live.players.filter((p) => p.status === 'DEAD').length,
              players: live.players.map((p) => ({
                name: p.name,
                role: p.role,
                status: p.status,
              })),
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, teams: teamsWithLive });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
