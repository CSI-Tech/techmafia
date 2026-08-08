import { Team, Player, PublicPlayer, VoteTally } from './types';
import { getRandomWordPair } from '../utils/words';

export class GameManager {
  private teams: Map<string, Team> = new Map();

  getOrCreateTeam(teamId: string, roomCode: string): Team {
    if (!this.teams.has(teamId)) {
      this.teams.set(teamId, {
        teamId,
        roomCode,
        players: [],
        currentState: 'WAITING_FOR_PLAYERS',
        currentRound: 1,
        timerEndsAt: null,
        votes: {},
        eliminatedThisRound: null,
        eliminatedRoleThisRound: null,
        voteTally: [],
        winner: null,
      });
    }
    return this.teams.get(teamId)!;
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  joinTeam(
    teamId: string,
    roomCode: string,
    playerId: string,
    playerName: string
  ): { success: boolean; message?: string } {
    let team = this.teams.get(teamId);

    // Auto-create for MVP (normally Admin creates via REST)
    if (!team) {
      team = this.getOrCreateTeam(teamId, roomCode);
    }

    if (team.roomCode !== roomCode) {
      return { success: false, message: 'Invalid room code' };
    }

    // Allow reconnect if player exists by name at any state
    const existing = team.players.find((p) => p.name === playerName);
    if (existing) {
      existing.id = playerId;
      return { success: true };
    }

    if (team.currentState !== 'WAITING_FOR_PLAYERS' && team.currentState !== 'READY') {
      return { success: false, message: 'Game already started' };
    }

    if (team.players.length >= 6) {
      return { success: false, message: 'Room is full' };
    }

    team.players.push({
      id: playerId,
      name: playerName,
      role: null,
      word: null,
      status: 'ALIVE',
    });

    if (team.players.length === 6) {
      team.currentState = 'READY';
    }

    return { success: true };
  }

  startGame(teamId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team || team.players.length !== 6 || team.currentState !== 'READY') return false;

    team.currentState = 'ROLE_REVEAL';
    this.assignRoles(team);
    return true;
  }

  private assignRoles(team: Team) {
    const indices = [0, 1, 2, 3, 4, 5];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const words = getRandomWordPair();

    team.players[indices[0]].role = 'MAFIA';
    team.players[indices[0]].word = words.mafia;
    team.players[indices[1]].role = 'MAFIA';
    team.players[indices[1]].word = words.mafia;

    for (let i = 2; i < 6; i++) {
      team.players[indices[i]].role = 'CIVILIAN';
      team.players[indices[i]].word = words.civilian;
    }
  }

  startDiscussion(teamId: string, durationMs: number = 90000): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (team.currentState !== 'ROLE_REVEAL' && team.currentState !== 'ELIMINATION') return null;

    team.currentState = 'DISCUSSION';
    team.timerEndsAt = Date.now() + durationMs;
    team.votes = {};
    team.eliminatedThisRound = null;
    team.eliminatedRoleThisRound = null;
    team.voteTally = [];
    return team;
  }

  startVoting(teamId: string, durationMs: number = 30000): Team | null {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'DISCUSSION') return null;

    team.currentState = 'VOTING';
    team.timerEndsAt = Date.now() + durationMs;
    return team;
  }

  submitVote(teamId: string, voterId: string, targetName: string): boolean {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'VOTING') return false;

    const voter = team.players.find((p) => p.id === voterId);
    if (!voter || voter.status !== 'ALIVE') return false;

    // Prevent re-voting
    if (team.votes[voterId] !== undefined) return false;

    team.votes[voterId] = targetName;

    // Auto-evaluate when all alive players have voted
    const alivePlayers = team.players.filter((p) => p.status === 'ALIVE');
    if (Object.keys(team.votes).length >= alivePlayers.length) {
      this.evaluateVotes(teamId);
    }

    return true;
  }

  evaluateVotes(teamId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'VOTING') return null;

    team.currentState = 'VOTE_RESULT';
    team.timerEndsAt = null;

    // Count votes
    const counts: Record<string, number> = {};
    for (const target of Object.values(team.votes)) {
      counts[target] = (counts[target] || 0) + 1;
    }

    // Build tally
    team.voteTally = Object.entries(counts).map(([name, count]) => ({ name, count }));
    team.voteTally.sort((a, b) => b.count - a.count);

    // Find winner (non-tie)
    let maxVotes = 0;
    let eliminatedName: string | null = null;
    let tie = false;

    for (const [name, count] of Object.entries(counts)) {
      if (name === 'NO_VOTE') continue;
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedName = name;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }

    if (!tie && eliminatedName) {
      const eliminated = team.players.find((p) => p.name === eliminatedName);
      if (eliminated) {
        eliminated.status = 'DEAD';
        team.eliminatedThisRound = eliminatedName;
        team.eliminatedRoleThisRound = eliminated.role;
      }
    } else {
      team.eliminatedThisRound = null;
      team.eliminatedRoleThisRound = null;
    }

    return team;
  }

  checkWinCondition(teamId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const alive = team.players.filter((p) => p.status === 'ALIVE');
    const mafiaAlive = alive.filter((p) => p.role === 'MAFIA').length;
    const civiliansAlive = alive.filter((p) => p.role === 'CIVILIAN').length;

    if (mafiaAlive === 0) {
      team.winner = 'CIVILIANS';
      team.currentState = 'GAME_COMPLETE';
    } else if (mafiaAlive >= civiliansAlive) {
      team.winner = 'MAFIA';
      team.currentState = 'GAME_COMPLETE';
    } else {
      team.currentState = 'ELIMINATION';
    }

    return team;
  }

  getSanitizedState(teamId: string, playerId: string) {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const reqPlayer = team.players.find((p) => p.id === playerId);

    let mafiaPartner: string | null = null;
    if (reqPlayer && reqPlayer.role === 'MAFIA') {
      const partner = team.players.find((p) => p.role === 'MAFIA' && p.id !== playerId);
      if (partner) mafiaPartner = partner.name;
    }

    const publicPlayers: PublicPlayer[] = team.players.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      voted: team.votes[p.id] !== undefined,
    }));

    return {
      teamId: team.teamId,
      roomCode: team.roomCode,
      currentState: team.currentState,
      currentRound: team.currentRound,
      timerEndsAt: team.timerEndsAt,
      players: publicPlayers,
      eliminatedThisRound: team.eliminatedThisRound,
      eliminatedRoleThisRound: team.eliminatedRoleThisRound,
      voteTally: team.voteTally,
      winner: team.winner,
      // Private to this player
      myId: playerId,
      myRole: reqPlayer ? reqPlayer.role : null,
      myWord: reqPlayer ? reqPlayer.word : null,
      myStatus: reqPlayer ? reqPlayer.status : null,
      myMafiaPartner: mafiaPartner,
      // Only reveal all roles at game end
      revealedRoles:
        team.currentState === 'GAME_COMPLETE'
          ? team.players.map((p) => ({ name: p.name, role: p.role }))
          : null,
    };
  }
}

export const gameManager = new GameManager();
