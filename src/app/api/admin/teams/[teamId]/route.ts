import { NextResponse } from 'next/server';
import { GameRoom } from '@/lib/db/models/GameRoom';
import { gameManager } from '@/lib/game/GameManager';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const room = await GameRoom.findOne({ teamId }).lean();
    if (!room) {
      return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });
    }

    const live = gameManager.getTeam(teamId);

    return NextResponse.json({
      success: true,
      team: {
        ...room,
        live: live
          ? {
              currentState: live.currentState,
              currentRound: live.currentRound,
              timerEndsAt: live.timerEndsAt,
              players: live.players.map((p) => ({
                name: p.name,
                role: p.role,
                status: p.status,
                word: p.word,
              })),
              votes: live.votes,
              voteTally: live.voteTally,
              winner: live.winner,
              advancingPlayers: live.advancingPlayers,
            }
          : null,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
