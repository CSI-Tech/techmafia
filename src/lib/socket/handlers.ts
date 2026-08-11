import { Namespace, Server, Socket } from 'socket.io';
import { gameManager } from '../game/GameManager';
import { logEvent, updateRoomStatus } from '../services/GameLogger';

export function setupSocketHandlers(io: Server, adminNs: Namespace) {
  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Emit individualised sanitized state to each socket in the player room */
  const broadcastGameState = (teamId: string) => {
    const room = io.sockets.adapter.rooms.get(teamId);
    if (room) {
      for (const clientId of room) {
        const state = gameManager.getSanitizedState(teamId, clientId);
        if (state) io.to(clientId).emit('gameStateSync', state);
      }
    }
    // Also notify all admin clients
    broadcastAdminUpdate(teamId);
  };

  /** Send a full admin team snapshot to every connected admin client */
  const broadcastAdminUpdate = (teamId: string) => {
    const team = gameManager.getTeam(teamId);
    if (!team) return;
    adminNs.emit('adminTeamUpdate', {
      teamId: team.teamId,
      roomCode: team.roomCode,
      currentState: team.currentState,
      currentRound: team.currentRound,
      timerEndsAt: team.timerEndsAt,
      winner: team.winner,
      players: team.players.map((p) => ({
        name: p.name,
        role: p.role,
        status: p.status,
      })),
      aliveCount: team.players.filter((p) => p.status === 'ALIVE').length,
      deadCount: team.players.filter((p) => p.status === 'DEAD').length,
      eliminatedThisRound: team.eliminatedThisRound,
      eliminatedRoleThisRound: team.eliminatedRoleThisRound,
      advancingPlayers: team.advancingPlayers,
    });
  };

  /** Schedule a state transition, fire only if team is still in expected state */
  const scheduleTransition = (
    teamId: string,
    expectedState: string,
    delayMs: number,
    fn: () => void
  ) => {
    setTimeout(() => {
      const team = gameManager.getTeam(teamId);
      if (team && team.currentState === expectedState) {
        fn();
        broadcastGameState(teamId);
      }
    }, Math.max(0, delayMs));
  };

  // ── Admin namespace ────────────────────────────────────────────────────────
  adminNs.on('connection', (socket) => {
    console.log(`[Admin WS +] ${socket.id}`);

    // On connect, send a full snapshot of all live teams
    const snapshot = gameManager.getAllTeams().map((team) => ({
      teamId: team.teamId,
      roomCode: team.roomCode,
      currentState: team.currentState,
      currentRound: team.currentRound,
      timerEndsAt: team.timerEndsAt,
      winner: team.winner,
      players: team.players.map((p) => ({ name: p.name, role: p.role, status: p.status })),
      aliveCount: team.players.filter((p) => p.status === 'ALIVE').length,
      deadCount: team.players.filter((p) => p.status === 'DEAD').length,
      eliminatedThisRound: team.eliminatedThisRound,
      eliminatedRoleThisRound: team.eliminatedRoleThisRound,
      advancingPlayers: team.advancingPlayers,
    }));
    socket.emit('adminSnapshot', snapshot);

    socket.on('disconnect', () => console.log(`[Admin WS -] ${socket.id}`));
  });

  // ── Player namespace ───────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    console.log(`[+] Connected: ${socket.id}`);

    socket.on('joinRoom', ({
      teamId, roomCode, playerName,
    }: { teamId: string; roomCode: string; playerName: string }) => {
      const result = gameManager.joinTeam(teamId, roomCode, socket.id, playerName);
      if (result.success) {
        socket.join(teamId);
        socket.data.teamId = teamId;
        socket.data.playerName = playerName;
        broadcastGameState(teamId);

        const team = gameManager.getTeam(teamId)!;
        logEvent(teamId, roomCode, team.currentRound, `${playerName} joined`);
        updateRoomStatus(teamId, {
          playerNames: team.players.map((p) => p.name),
          status: team.players.length >= 8 ? 'READY' : 'WAITING',
        });
      } else {
        socket.emit('joinError', result.message);
      }
    });

    socket.on('startGame', ({ teamId }: { teamId: string }) => {
      if (gameManager.startGame(teamId)) {
        const team = gameManager.getTeam(teamId)!;
        broadcastGameState(teamId);
        logEvent(teamId, team.roomCode, team.currentRound, 'Game started — roles assigned secretly');
        logEvent(teamId, team.roomCode, 1, 'Round 1 questions delivered to players');
        updateRoomStatus(teamId, { status: 'IN_PROGRESS' });
      }
    });

    socket.on('submitRound1Answer', ({ teamId, answer }: { teamId: string; answer: string }) => {
      const result = gameManager.submitRound1Answer(teamId, socket.id, answer);
      if (result.success) {
        logEvent(teamId, gameManager.getTeam(teamId)!.roomCode, 1, `${socket.data.playerName} submitted Round 1 answer. Correct: ${result.correct}`);
        broadcastGameState(teamId);

        const team = gameManager.getTeam(teamId)!;
        // If it transitioned to discussion:
        if (team.currentState === 'ROUND_1_DISCUSSION') {
          logEvent(teamId, team.roomCode, 1, 'Round 1 Discussion started');
          
          const discussionEnd = team.timerEndsAt! - Date.now();
          scheduleTransition(teamId, 'ROUND_1_DISCUSSION', discussionEnd, () => {
            gameManager.startVoting(teamId);
            logEvent(teamId, team.roomCode, 1, 'Round 1 Voting started');
          });
        }
      }
    });

    socket.on('submitVote', ({ teamId, targetName }: { teamId: string; targetName: string }) => {
      const voted = gameManager.submitVote(teamId, socket.id, targetName);
      if (voted) {
        const team = gameManager.getTeam(teamId)!;
        const voter = team.players.find((p) => p.id === socket.id);
        logEvent(teamId, team.roomCode, team.currentRound,
          `${voter?.name ?? socket.id} voted`, `Target: ${targetName}`);
        broadcastGameState(teamId);

        // If vote result resolved automatically:
        if (team.currentState === 'ROUND_1_RESULT' || team.currentState === 'ROUND_RESULT') {
          const elim = team.eliminatedThisRound;
          const role = team.eliminatedRoleThisRound;
          if (elim) {
            logEvent(teamId, team.roomCode, team.currentRound,
              `${elim} eliminated`, `Role: ${role}`);
          } else {
            logEvent(teamId, team.roomCode, team.currentRound, 'Vote tied — no elimination');
          }
        }
      }
    });

    socket.on('proceedToNight', ({ teamId }: { teamId: string }) => {
      const team = gameManager.proceedToNight(teamId);
      if (team) {
        logEvent(teamId, team.roomCode, team.currentRound, `Night phase started`);
        broadcastGameState(teamId);
      }
    });

    socket.on('submitNightQuiz', ({ teamId, answer }: { teamId: string; answer: string }) => {
      if (gameManager.submitNightQuiz(teamId, socket.id, answer)) {
        logEvent(teamId, gameManager.getTeam(teamId)!.roomCode, gameManager.getTeam(teamId)!.currentRound, `${socket.data.playerName} solved Night quiz`);
        broadcastGameState(teamId);
        checkAndLogNightCompletion(teamId);
      }
    });

    socket.on('submitNightAction', ({ teamId, targetId }: { teamId: string; targetId: string }) => {
      if (gameManager.submitNightAction(teamId, socket.id, targetId)) {
        const team = gameManager.getTeam(teamId)!;
        const player = team.players.find(p => p.id === socket.id);
        const target = team.players.find(p => p.id === targetId);
        logEvent(teamId, team.roomCode, team.currentRound, `${player?.name} performed night action`, `Target: ${target?.name}`);
        broadcastGameState(teamId);
        checkAndLogNightCompletion(teamId);
      }
    });

    const checkAndLogNightCompletion = (teamId: string) => {
      const team = gameManager.getTeam(teamId)!;
      if (team.currentState === 'MORNING_RESULT' || team.currentState === 'GAME_COMPLETE') {
        logEvent(teamId, team.roomCode, team.currentRound - 1, `Night resolved. Morning has arrived.`);
        team.morningResults.forEach(res => {
          logEvent(teamId, team.roomCode, team.currentRound - 1, `Morning Announcement: ${res}`);
        });

        // Persist completed game stats if game complete
        if (team.currentState === 'GAME_COMPLETE') {
          logGameComplete(teamId, team);
        }
      }
    };

    socket.on('startDiscussion', ({ teamId }: { teamId: string }) => {
      const team = gameManager.startDiscussion(teamId);
      if (!team) return;

      broadcastGameState(teamId);
      logEvent(teamId, team.roomCode, team.currentRound, `Discussion Round ${team.currentRound} started`);

      const discussionEnd = team.timerEndsAt! - Date.now();
      scheduleTransition(teamId, 'ROUND_2_DISCUSSION', discussionEnd, () => {
        gameManager.startVoting(teamId);
        logEvent(teamId, team.roomCode, team.currentRound, `Voting Round ${team.currentRound} started`);
      });
    });

    const logGameComplete = (teamId: string, team: any) => {
      logEvent(teamId, team.roomCode, team.currentRound, `Game complete — ${team.winner} win`);
      const advancingNames = team.players
        .filter((p: any) => team.advancingPlayers.includes(p.id))
        .map((p: any) => p.name);

      updateRoomStatus(teamId, {
        status: 'COMPLETED',
        winner: team.winner,
        rounds: team.currentRound,
        completedAt: new Date(),
        eliminationHistory: team.players
          .filter((p: any) => p.status === 'DEAD')
          .map((p: any) => ({
            round: p.eliminatedRound || 0,
            playerName: p.name,
            role: p.role ?? 'UNKNOWN',
          })),
        advancingPlayerNames: advancingNames,
      });
    };

    socket.on('disconnect', () => {
      console.log(`[-] Disconnected: ${socket.id}`);
    });
  });
}
