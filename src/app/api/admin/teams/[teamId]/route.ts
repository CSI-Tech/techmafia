import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/db/dbHelper';
import { gameManager } from '@/lib/game/GameManager';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const room = await getRoom(teamId);
    if (!room) {
      return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });
    }

    const live = gameManager.getTeam(teamId) || room.liveState;

    return NextResponse.json({
      success: true,
      team: {
        ...room,
        live: live
          ? {
              currentState: live.currentState,
              currentRound: live.currentRound,
              timerEndsAt: live.timerEndsAt,
              players: live.players.map((p: any) => ({
                name: p.name,
                role: p.role,
                status: p.status,
                eliminatedRound: p.eliminatedRound,
                eliminatedCause: p.eliminatedCause,
                nightQuizAnswered: p.nightQuizAnswered,
                nightActionTarget: p.nightActionTarget,
                targetPlayerName: live.players.find((tp: any) => tp.id === p.nightActionTarget)?.name || null,
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

export async function DELETE(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { deleteRoom } = require('@/lib/db/dbHelper');

    // 1. Delete from database
    await deleteRoom(teamId);

    // 2. Delete from in-memory game manager
    gameManager.deleteTeam(teamId);

    // 3. Notify and evict player sockets
    const globalForSockets = global as unknown as { io?: any; adminNs?: any };
    if (globalForSockets.io) {
      globalForSockets.io.to(teamId).emit('roomDeleted');
      const roomSockets = globalForSockets.io.sockets.adapter.rooms.get(teamId);
      if (roomSockets) {
        for (const socketId of roomSockets) {
          const s = globalForSockets.io.sockets.sockets.get(socketId);
          if (s) s.leave(teamId);
        }
      }
    }

    if (globalForSockets.adminNs) {
      globalForSockets.adminNs.emit('adminTeamDeleted', { teamId });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API DELETE team] error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
