import { NextResponse } from 'next/server';
import { getRooms } from '@/lib/db/dbHelper';
import { gameManager } from '@/lib/game/GameManager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email query parameter is required' }, { status: 400 });
    }

    // Query active rooms (status NOT completed)
    const rooms = await getRooms({ status: { $ne: 'COMPLETED' } });

    // Look for a room where a player has this googleEmail
    for (const room of rooms) {
      const live = gameManager.getTeam(room.teamId) || room.liveState;
      if (live && live.currentState !== 'GAME_COMPLETE' && Array.isArray(live.players)) {
        const player = live.players.find((p: any) => p.googleEmail?.trim().toLowerCase() === email);
        if (player) {
          return NextResponse.json({
            success: true,
            active: true,
            teamId: room.teamId,
            roomCode: room.roomCode || room.loginCode || '',
            playerName: player.name,
          });
        }
      }
    }

    return NextResponse.json({ success: true, active: false });
  } catch (err) {
    console.error('Active game route error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
