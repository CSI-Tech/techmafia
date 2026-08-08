import { Server, Socket } from 'socket.io';
import { gameManager } from '../state/GameManager';

export function setupSocketHandlers(io: Server) {
  // Helper: emit individualised sanitized state to each socket in the room
  const broadcastGameState = (teamId: string) => {
    const room = io.sockets.adapter.rooms.get(teamId);
    if (!room) return;
    for (const clientId of room) {
      const state = gameManager.getSanitizedState(teamId, clientId);
      if (state) {
        io.to(clientId).emit('gameStateSync', state);
      }
    }
  };

  // Helper: schedule a timeout and only fire if the team is still in the expected state
  const scheduleTransition = (teamId: string, expectedState: string, delayMs: number, fn: () => void) => {
    setTimeout(() => {
      const team = gameManager.getTeam(teamId);
      if (team && team.currentState === expectedState) {
        fn();
      }
    }, Math.max(0, delayMs));
  };

  io.on('connection', (socket: Socket) => {
    console.log(`[+] Connected: ${socket.id}`);

    socket.on('joinRoom', ({ teamId, roomCode, playerName }: { teamId: string; roomCode: string; playerName: string }) => {
      const result = gameManager.joinTeam(teamId, roomCode, socket.id, playerName);
      if (result.success) {
        socket.join(teamId);
        socket.data.teamId = teamId;
        socket.data.playerName = playerName;
        broadcastGameState(teamId);
      } else {
        socket.emit('joinError', result.message);
      }
    });

    socket.on('startGame', ({ teamId }: { teamId: string }) => {
      if (gameManager.startGame(teamId)) {
        broadcastGameState(teamId);
      }
    });

    socket.on('startDiscussion', ({ teamId }: { teamId: string }) => {
      const team = gameManager.startDiscussion(teamId);
      if (!team) return;

      broadcastGameState(teamId);

      const discussionEnd = team.timerEndsAt! - Date.now();

      scheduleTransition(teamId, 'DISCUSSION', discussionEnd, () => {
        const vTeam = gameManager.startVoting(teamId);
        if (!vTeam) return;
        broadcastGameState(teamId);

        const votingEnd = vTeam.timerEndsAt! - Date.now();

        scheduleTransition(teamId, 'VOTING', votingEnd, () => {
          const resultTeam = gameManager.evaluateVotes(teamId);
          if (resultTeam) {
            broadcastGameState(teamId);
          }
        });
      });
    });

    socket.on('submitVote', ({ teamId, targetName }: { teamId: string; targetName: string }) => {
      const voted = gameManager.submitVote(teamId, socket.id, targetName);
      if (voted) {
        broadcastGameState(teamId);
        // If evaluateVotes was auto-triggered inside submitVote (all voted), broadcast again
        const team = gameManager.getTeam(teamId);
        if (team && team.currentState === 'VOTE_RESULT') {
          broadcastGameState(teamId);
        }
      }
    });

    socket.on('proceedToWinCheck', ({ teamId }: { teamId: string }) => {
      const team = gameManager.getTeam(teamId);
      if (team && (team.currentState === 'VOTE_RESULT' || team.currentState === 'ELIMINATION')) {
        gameManager.checkWinCondition(teamId);
        broadcastGameState(teamId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[-] Disconnected: ${socket.id}`);
      // Player record is preserved in memory; they can reconnect using the same name
    });
  });
}
