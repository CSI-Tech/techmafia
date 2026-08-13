import { Namespace, Server, Socket } from 'socket.io';
import { gameManager } from '../game/GameManager';
import { logEvent, updateRoomStatus } from '../services/GameLogger';
import crypto from 'crypto';
import { getRoom, saveTeamLiveState } from '../db/dbHelper';

import type { Team, Player } from '../game/types';
import type { GameState } from '@/types';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift()?.trim() || ''] = decodeURI(parts.join('='));
  });
  return list;
}

export function setupSocketHandlers(io: Server, adminNs: Namespace) {
  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Emit individualised sanitized state to each socket in the player room */
  const broadcastGameState = async (teamId: string) => {
    const team = gameManager.getTeam(teamId);
    if (team) {
      try {
        await saveTeamLiveState(teamId, team);
      } catch (err) {
        console.error('[Socket] Failed to save team liveState:', err);
      }
    }

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
        id: p.id,
        name: p.name,
        role: p.role,
        status: p.status,
        eliminatedRound: p.eliminatedRound,
        eliminatedCause: p.eliminatedCause,
        nightQuizAnswered: p.nightQuizAnswered,
        nightActionTarget: p.nightActionTarget,
        targetPlayerName: team.players.find(tp => tp.id === p.nightActionTarget)?.name || null,
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
    setTimeout(async () => {
      const team = gameManager.getTeam(teamId);
      if (team && team.currentState === expectedState) {
        await fn();
        await broadcastGameState(teamId);
      }
    }, Math.max(0, delayMs));
  };

  // ── Admin namespace ────────────────────────────────────────────────────────
  adminNs.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      const adminToken = cookies['admin_token'];

      const secret = process.env.ADMIN_PASSWORD || 'techmafia2026';
      const expected = crypto.createHash('sha256').update(secret).digest('hex');

      if (adminToken === expected) {
        next();
      } else {
        next(new Error('Authentication error'));
      }
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

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
      players: team.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        status: p.status,
        eliminatedRound: p.eliminatedRound,
        eliminatedCause: p.eliminatedCause,
        nightQuizAnswered: p.nightQuizAnswered,
        nightActionTarget: p.nightActionTarget,
        targetPlayerName: team.players.find(tp => tp.id === p.nightActionTarget)?.name || null,
      })),
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

    socket.on('joinRoom', async ({
      teamId, roomCode, playerName, playerSessionId,
    }: { teamId: string; roomCode: string; playerName: string; playerSessionId?: string }) => {
      try {
        if (!teamId || typeof teamId !== 'string' || !roomCode || typeof roomCode !== 'string') {
          socket.emit('joinError', 'Invalid team or room code');
          return;
        }

        const room = await getRoom(teamId);
        if (!room) {
          socket.emit('joinError', 'Team not found');
          return;
        }

        if (room.roomCode !== roomCode) {
          socket.emit('joinError', 'Invalid room code');
          return;
        }

        if (!gameManager.getTeam(teamId)) {
          if (room.liveState) {
            gameManager.loadTeamFromState(teamId, room.liveState);
          } else {
            gameManager.initializeTeam(teamId, roomCode, room.status);
          }
        }

        const result = gameManager.joinTeam(teamId, roomCode, socket.id, playerName, playerSessionId);
        if (result.success) {
          socket.join(teamId);
          socket.data.teamId = teamId;
          socket.data.playerName = playerName.trim();
          await broadcastGameState(teamId);

          const team = gameManager.getTeam(teamId)!;
          await logEvent(teamId, roomCode, team.currentRound, `${playerName.trim()} joined`);
          await updateRoomStatus(teamId, {
            playerNames: team.players.map((p) => p.name),
            status: team.players.length >= 8 ? 'READY' : 'WAITING',
          });
        } else {
          socket.emit('joinError', result.message || 'Could not join room');
        }
      } catch (err) {
        socket.emit('joinError', 'Server error');
      }
    });

    socket.on('startGame', async ({ teamId }: { teamId: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || team.currentState !== 'READY') {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      if (gameManager.startGame(teamId)) {
        await broadcastGameState(teamId);
        await logEvent(teamId, team.roomCode, team.currentRound, 'Game started — roles assigned secretly');
        await logEvent(teamId, team.roomCode, 1, 'Round 1 questions delivered to players');
        await updateRoomStatus(teamId, { status: 'IN_PROGRESS' });
      }
    });

    socket.on('submitRound1Answer', async ({ teamId, answer }: { teamId: string; answer: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || team.currentState !== 'ROUND_1_QUESTION') {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      const player = team.players.find(p => p.id === socket.id);
      if (!player || player.status !== 'ALIVE') {
        socket.emit('error', 'Spectators cannot answer questions');
        return;
      }

      const result = gameManager.submitRound1Answer(teamId, socket.id, answer);
      if (result.success) {
        await logEvent(teamId, team.roomCode, 1, `${socket.data.playerName} submitted Round 1 answer. Correct: ${result.correct}`);
        await broadcastGameState(teamId);

        // If it transitioned to discussion:
        if ((team.currentState as GameState) === 'ROUND_1_DISCUSSION') {
          await logEvent(teamId, team.roomCode, 1, 'Round 1 Discussion started');
          
          const discussionEnd = team.timerEndsAt! - Date.now();
          scheduleTransition(teamId, 'ROUND_1_DISCUSSION', discussionEnd, async () => {
            gameManager.startVoting(teamId);
            const t = gameManager.getTeam(teamId)!;
            await logEvent(teamId, t.roomCode, 1, 'Round 1 Voting started');

            // Schedule automatic voting evaluation transition
            scheduleTransition(teamId, 'ROUND_1_VOTING', 30000, async () => {
              gameManager.evaluateVotes(teamId);
              const tr = gameManager.getTeam(teamId)!;
              await logEvent(teamId, tr.roomCode, 1, 'Round 1 Voting ended automatically');
              const elim = tr.eliminatedThisRound;
              if (elim) {
                await logEvent(teamId, tr.roomCode, 1, `${elim} eliminated`, `Role: ${tr.eliminatedRoleThisRound}`);
              } else {
                await logEvent(teamId, tr.roomCode, 1, 'Vote tied — no elimination');
              }
            });
          });
        }
      }
    });

    socket.on('submitVote', async ({ teamId, targetName }: { teamId: string; targetName: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || (team.currentState !== 'ROUND_1_VOTING' && team.currentState !== 'ROUND_2_VOTING')) {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      const voter = team.players.find((p) => p.id === socket.id);
      if (!voter || voter.status !== 'ALIVE') {
        socket.emit('error', 'Spectators cannot vote');
        return;
      }

      const voted = gameManager.submitVote(teamId, socket.id, targetName);
      if (voted) {
        await logEvent(teamId, team.roomCode, team.currentRound,
          `${voter.name} voted`, `Target: ${targetName}`);
        await broadcastGameState(teamId);

        // If vote result resolved automatically:
        if ((team.currentState as GameState) === 'ROUND_1_RESULT' || (team.currentState as GameState) === 'ROUND_RESULT') {
          const elim = team.eliminatedThisRound;
          const role = team.eliminatedRoleThisRound;
          if (elim) {
            await logEvent(teamId, team.roomCode, team.currentRound,
              `${elim} eliminated`, `Role: ${role}`);
          } else {
            await logEvent(teamId, team.roomCode, team.currentRound, 'Vote tied — no elimination');
          }
        }
      }
    });

    socket.on('proceedToNight', async ({ teamId }: { teamId: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || (team.currentState !== 'ROUND_1_RESULT' && team.currentState !== 'ROUND_RESULT' && team.currentState !== 'ROLE_REVEAL')) {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      const player = team.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', 'Not a member of this team');
        return;
      }

      const updatedTeam = gameManager.proceedToNight(teamId);
      if (updatedTeam) {
        await logEvent(teamId, updatedTeam.roomCode, updatedTeam.currentRound, `Night phase started`);
        await broadcastGameState(teamId);
      }
    });

    socket.on('submitNightQuiz', async ({ teamId }: { teamId: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || team.currentState !== 'NIGHT') {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      const player = team.players.find(p => p.id === socket.id);
      if (!player || player.status !== 'ALIVE' || player.role !== 'CIVILIAN') {
        socket.emit('error', 'Only alive civilians can submit night quiz');
        return;
      }

      if (gameManager.submitNightQuiz(teamId, socket.id)) {
        await logEvent(teamId, team.roomCode, team.currentRound, `${socket.data.playerName} solved Night quiz`);
        await broadcastGameState(teamId);
        await checkAndLogNightCompletion(teamId);
      }
    });

    socket.on('submitNightAction', async ({ teamId, targetId }: { teamId: string; targetId: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || team.currentState !== 'NIGHT') {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      const player = team.players.find(p => p.id === socket.id);
      if (!player || player.status !== 'ALIVE' || (player.role !== 'MAFIA' && player.role !== 'INVESTIGATOR')) {
        socket.emit('error', 'Unauthorized night action');
        return;
      }
      const target = team.players.find(p => p.id === targetId);
      if (!target || target.status !== 'ALIVE') {
        socket.emit('error', 'Invalid action target');
        return;
      }

      if (gameManager.submitNightAction(teamId, socket.id, targetId)) {
        await logEvent(teamId, team.roomCode, team.currentRound, `${player.name} performed night action`, `Target: ${target.name}`);
        await broadcastGameState(teamId);
        await checkAndLogNightCompletion(teamId);
      }
    });

    const checkAndLogNightCompletion = async (teamId: string) => {
      const team = gameManager.getTeam(teamId)!;
      if (team.currentState === 'MORNING_RESULT' || team.currentState === 'GAME_COMPLETE') {
        await logEvent(teamId, team.roomCode, team.currentRound - 1, `Night resolved. Morning has arrived.`);
        for (const res of team.morningResults) {
          await logEvent(teamId, team.roomCode, team.currentRound - 1, `Morning Announcement: ${res}`);
        }

        // Persist completed game stats if game complete
        if (team.currentState === 'GAME_COMPLETE') {
          await logGameComplete(teamId, team);
        }
      }
    };

    socket.on('startDiscussion', async ({ teamId }: { teamId: string }) => {
      if (socket.data.teamId !== teamId) {
        socket.emit('error', 'Unauthorized team');
        return;
      }
      const team = gameManager.getTeam(teamId);
      if (!team || team.currentState !== 'MORNING_RESULT') {
        socket.emit('error', 'Invalid game stage');
        return;
      }
      const player = team.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', 'Not a member of this team');
        return;
      }

      const updatedTeam = gameManager.startDiscussion(teamId);
      if (!updatedTeam) return;

      await broadcastGameState(teamId);
      await logEvent(teamId, updatedTeam.roomCode, updatedTeam.currentRound, `Discussion Round ${updatedTeam.currentRound} started`);

      const discussionEnd = updatedTeam.timerEndsAt! - Date.now();
      scheduleTransition(teamId, 'ROUND_2_DISCUSSION', discussionEnd, async () => {
        gameManager.startVoting(teamId);
        const t = gameManager.getTeam(teamId)!;
        await logEvent(teamId, t.roomCode, t.currentRound, `Voting Round ${t.currentRound} started`);

        // Schedule automatic voting evaluation transition
        scheduleTransition(teamId, 'ROUND_2_VOTING', 30000, async () => {
          gameManager.evaluateVotes(teamId);
          const tr = gameManager.getTeam(teamId)!;
          await logEvent(teamId, tr.roomCode, tr.currentRound, `Voting Round ${tr.currentRound} ended automatically`);
          const elim = tr.eliminatedThisRound;
          if (elim) {
            await logEvent(teamId, tr.roomCode, tr.currentRound, `${elim} eliminated`, `Role: ${tr.eliminatedRoleThisRound}`);
          } else {
            await logEvent(teamId, tr.roomCode, tr.currentRound, 'Vote tied — no elimination');
          }
        });
      });
    });

    const logGameComplete = async (teamId: string, team: Team) => {
      await logEvent(teamId, team.roomCode, team.currentRound, `Game complete — ${team.winner} win`);
      const advancingNames = team.players
        .filter((p: Player) => team.advancingPlayers.includes(p.id))
        .map((p: Player) => p.name);

      await updateRoomStatus(teamId, {
        status: 'COMPLETED',
        winner: team.winner,
        rounds: team.currentRound,
        completedAt: new Date(),
        eliminationHistory: team.players
          .filter((p: Player) => p.status === 'DEAD')
          .map((p: Player) => ({
            round: p.eliminatedRound || 0,
            playerName: p.name,
            role: p.role ?? 'UNKNOWN',
          })),
        advancingPlayerNames: advancingNames,
        playerRoles: team.players.map((p: Player) => ({
          name: p.name,
          role: p.role ?? 'UNKNOWN',
        })),
      });
    };

    socket.on('disconnect', () => {
      console.log(`[-] Disconnected: ${socket.id}`);
    });
  });
}
