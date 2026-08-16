import { Team, Player } from './types';
import { PublicPlayer } from '@/types';
import { loadRound1Questions, loadNightQuizzes } from './content';

export function getRoleCountsForTeamSize(maxPlayers: number): { mafia: number; investigator: number; civilian: number } {
  if (maxPlayers <= 6) {
    return { mafia: 1, investigator: 1, civilian: Math.max(0, maxPlayers - 2) };
  } else if (maxPlayers === 7) {
    return { mafia: 2, investigator: 1, civilian: 4 };
  } else {
    return { mafia: 2, investigator: 1, civilian: Math.max(0, maxPlayers - 3) };
  }
}

export class GameManager {
  private teams: Map<string, Team> = new Map();

  initializeTeam(teamId: string, roomCode: string, status?: string, maxPlayers: number = 8): Team {
    if (!this.teams.has(teamId)) {
      this.teams.set(teamId, {
        teamId,
        roomCode,
        maxPlayers,
        players: [],
        currentState: status === 'READY' ? 'READY' : (status === 'IN_PROGRESS' ? 'ROUND_1_QUESTION' : 'WAITING_FOR_PLAYERS'),
        currentRound: 1,
        timerEndsAt: null,
        votes: {},
        eliminatedThisRound: null,
        eliminatedRoleThisRound: null,
        voteTally: [],
        winner: null,
        alivePlayers: 0,
        aliveMafia: 0,
        aliveCivilians: 0,
        aliveInvestigator: 0,
        advancingPlayers: [],
        createdAt: new Date().toISOString(),
        round1QuestionSetId: null,
        currentNightQuizId: null,
        investigatorResult: null,
        morningResults: [],
        tieRule: 'NO_ELIMINATION',
        mafiaSelectionRule: 'KILL_ALL',
      });
    }
    return this.teams.get(teamId)!;
  }

  getOrCreateTeam(teamId: string, roomCode: string, maxPlayers: number = 8): Team {
    if (!this.teams.has(teamId)) {
      this.teams.set(teamId, {
        teamId,
        roomCode,
        maxPlayers,
        players: [],
        currentState: 'WAITING_FOR_PLAYERS',
        currentRound: 1,
        timerEndsAt: null,
        votes: {},
        eliminatedThisRound: null,
        eliminatedRoleThisRound: null,
        voteTally: [],
        winner: null,
        alivePlayers: 0,
        aliveMafia: 0,
        aliveCivilians: 0,
        aliveInvestigator: 0,
        advancingPlayers: [],
        createdAt: new Date().toISOString(),
        round1QuestionSetId: null,
        currentNightQuizId: null,
        investigatorResult: null,
        morningResults: [],
        tieRule: 'NO_ELIMINATION',
        mafiaSelectionRule: 'KILL_ALL',
      });
    }
    return this.teams.get(teamId)!;
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  joinTeam(
    teamId: string,
    playerId: string,
    playerName: string,
    playerSessionId?: string
  ): { success: boolean; message?: string } {
    if (!teamId || typeof teamId !== 'string') {
      return { success: false, message: 'Invalid login code' };
    }

    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: 'Invalid login code' };
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0 || playerName.length > 20) {
      return { success: false, message: 'Invalid player name' };
    }
    const trimmedName = playerName.trim();

    // Allow reconnect if player exists by name
    const existing = team.players.find((p) => p.name === trimmedName);
    if (existing) {
      if (existing.sessionId && existing.sessionId !== playerSessionId) {
        return { success: false, message: 'Name already in use' };
      }
      existing.id = playerId;
      return { success: true };
    }

    if (team.currentState !== 'WAITING_FOR_PLAYERS' && team.currentState !== 'READY') {
      return { success: false, message: 'Game already started' };
    }

    const maxP = team.maxPlayers || 8;
    if (team.players.length >= maxP) {
      return { success: false, message: 'Room is full' };
    }

    team.players.push({
      id: playerId,
      name: trimmedName,
      role: null,
      status: 'ALIVE',
      sessionId: playerSessionId,
    });

    if (team.players.length >= maxP) {
      team.currentState = 'READY';
    }

    return { success: true };
  }

  startGame(teamId: string): boolean {
    const team = this.teams.get(teamId);
    const maxP = team?.maxPlayers || 8;
    if (!team || team.players.length !== maxP || team.currentState !== 'READY') return false;

    this.assignRoles(team);
    this.startRound1Question(teamId);

    return true;
  }

  private assignRoles(team: Team) {
    const maxP = team.maxPlayers || 8;
    const counts = getRoleCountsForTeamSize(maxP);
    const indices = team.players.map((_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let ptr = 0;
    for (let i = 0; i < counts.mafia && ptr < indices.length; i++) {
      team.players[indices[ptr++]].role = 'MAFIA';
    }
    for (let i = 0; i < counts.investigator && ptr < indices.length; i++) {
      team.players[indices[ptr++]].role = 'INVESTIGATOR';
    }
    while (ptr < indices.length) {
      team.players[indices[ptr++]].role = 'CIVILIAN';
    }
  }

  startRound1Question(teamId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    team.currentState = 'ROUND_1_QUESTION';
    team.currentRound = 1;
    team.timerEndsAt = Date.now() + 120000; // Exactly 2 minutes
    
    // Select random Round 1 question set
    const questionSets = loadRound1Questions();
    if (questionSets.length > 0) {
      const selected = questionSets[Math.floor(Math.random() * questionSets.length)];
      team.round1QuestionSetId = selected.id;
    }

    // Reset player answer states
    team.players.forEach(p => {
      p.round1Answered = false;
      p.round1AnswerCorrect = false;
      p.round1AnswerText = undefined;
    });

    return team;
  }

  submitRound1Answer(teamId: string, playerId: string, answer: string): { success: boolean; correct: boolean } {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'ROUND_1_QUESTION') return { success: false, correct: false };

    const player = team.players.find(p => p.id === playerId);
    if (!player || player.status !== 'ALIVE') return { success: false, correct: false };

    const questionSets = loadRound1Questions();
    const currentSet = questionSets.find(q => q.id === team.round1QuestionSetId);
    if (!currentSet) return { success: false, correct: false };

    const cleanUserAns = (answer || '').trim().toLowerCase();
    let isCorrect = false;
    if (player.role === 'MAFIA') {
      const cleanTarget = (currentSet.mafia.answer || '').trim().toLowerCase();
      isCorrect = cleanTarget === cleanUserAns;
    } else {
      const cleanTarget = (currentSet.civilian.answer || '').trim().toLowerCase();
      isCorrect = cleanTarget === cleanUserAns;
    }

    player.round1Answered = true;
    player.round1AnswerText = (answer || '').trim();
    player.round1AnswerCorrect = isCorrect;

    // Check if all alive players have answered
    const alivePlayers = team.players.filter(p => p.status === 'ALIVE');
    const allAnswered = alivePlayers.every(p => p.round1Answered);
    if (allAnswered) {
      // Auto transition to Round 1 Discussion
      this.startDiscussion(teamId, 90000);
    }

    return { success: true, correct: isCorrect };
  }

  startDiscussion(teamId: string, durationMs: number = 90000): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    if (team.currentRound === 1) {
      team.currentState = 'ROUND_1_DISCUSSION';
    } else {
      team.currentState = team.currentRound === 2 ? 'ROUND_2_DISCUSSION' : 'ROUND_RESULT'; // fallback / state transition
      // Standardize game state names:
      if (team.currentRound >= 2) {
        team.currentState = 'ROUND_2_DISCUSSION'; // We will use ROUND_2_DISCUSSION as general discussion for R2+
      }
    }
    
    team.timerEndsAt = Date.now() + durationMs;
    team.votes = {};
    team.eliminatedThisRound = null;
    team.eliminatedRoleThisRound = null;
    team.voteTally = [];
    return team;
  }

  startVoting(teamId: string, durationMs: number = 30000): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    if (team.currentRound === 1) {
      team.currentState = 'ROUND_1_VOTING';
    } else {
      team.currentState = 'ROUND_2_VOTING';
    }
    team.timerEndsAt = Date.now() + durationMs;
    return team;
  }

  submitVote(teamId: string, voterId: string, targetName: string): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const isVotingState = team.currentState === 'ROUND_1_VOTING' || team.currentState === 'ROUND_2_VOTING';
    if (!isVotingState) return false;

    const voter = team.players.find((p) => p.id === voterId);
    if (!voter || voter.status !== 'ALIVE') return false;

    // Cannot vote for self
    if (voter.name === targetName) return false;

    // Cannot vote for dead player
    const targetPlayer = team.players.find(p => p.name === targetName);
    if (targetPlayer && targetPlayer.status !== 'ALIVE') return false;

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
    if (!team) return null;

    if (team.currentState !== 'ROUND_1_VOTING' && team.currentState !== 'ROUND_2_VOTING') {
      return null;
    }

    if (team.currentRound === 1) {
      team.currentState = 'ROUND_1_RESULT';
    } else {
      team.currentState = 'ROUND_RESULT';
    }
    team.timerEndsAt = null;

    // Count votes
    const counts: Record<string, number> = {};
    for (const target of Object.values(team.votes)) {
      counts[target] = (counts[target] || 0) + 1;
    }

    // Build tally
    team.voteTally = Object.entries(counts).map(([name, count]) => ({ name, count }));
    team.voteTally.sort((a, b) => b.count - a.count);

    // Find winner
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

    if (tie && team.tieRule === 'NO_ELIMINATION') {
      team.eliminatedThisRound = null;
      team.eliminatedRoleThisRound = null;
    } else if (eliminatedName) {
      const eliminated = team.players.find((p) => p.name === eliminatedName);
      if (eliminated) {
        eliminated.status = 'DEAD';
        eliminated.eliminatedRound = team.currentRound;
        eliminated.eliminatedCause = 'VOTED_OUT';
        team.eliminatedThisRound = eliminatedName;
        team.eliminatedRoleThisRound = eliminated.role;
      }
    } else {
      team.eliminatedThisRound = null;
      team.eliminatedRoleThisRound = null;
    }

    // Check win condition after elimination
    this.checkWinCondition(teamId);

    return team;
  }

  proceedToNight(teamId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team || team.winner !== null) return null;

    // If we just finished ROUND_1_RESULT, transition to ROLE_REVEAL first, then NIGHT
    if (team.currentState === 'ROUND_1_RESULT') {
      team.currentState = 'ROLE_REVEAL';
      return team;
    }

    team.currentState = 'NIGHT';
    
    // Pick random Night Quiz
    const quizzes = loadNightQuizzes();
    if (quizzes.length > 0) {
      const q = quizzes[Math.floor(Math.random() * quizzes.length)];
      team.currentNightQuizId = q.id;
    }

    // Reset night states
    team.players.forEach(p => {
      p.nightQuizAnswered = false;
      p.nightActionTarget = null;
    });
    team.investigatorResult = null;
    team.morningResults = [];

    return team;
  }

  submitNightQuiz(teamId: string, playerId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'NIGHT') return false;

    const player = team.players.find(p => p.id === playerId);
    if (!player || player.status !== 'ALIVE' || player.role !== 'CIVILIAN') return false;

    player.nightQuizAnswered = true;
    this.checkNightResolution(teamId);
    return true;
  }

  submitNightAction(teamId: string, playerId: string, targetId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'NIGHT') return false;

    const player = team.players.find(p => p.id === playerId);
    if (!player || player.status !== 'ALIVE') return false;

    // Validate target
    const target = team.players.find(p => p.id === targetId);
    if (!target || target.status !== 'ALIVE') return false;

    if (player.role === 'MAFIA') {
      // Mafia cannot select themselves or other Mafia
      if (target.role === 'MAFIA') return false;
      player.nightActionTarget = targetId;
    } else if (player.role === 'INVESTIGATOR') {
      // Investigator cannot select themselves
      if (target.id === player.id) return false;
      player.nightActionTarget = targetId;
    } else {
      return false; // Civilian has no night target action
    }

    this.checkNightResolution(teamId);
    return true;
  }

  private checkNightResolution(teamId: string) {
    const team = this.teams.get(teamId);
    if (!team) return;

    const alivePlayers = team.players.filter(p => p.status === 'ALIVE');
    
    // Check if all alive Mafia have chosen a target
    const aliveMafia = alivePlayers.filter(p => p.role === 'MAFIA');
    const mafiaDone = aliveMafia.every(m => m.nightActionTarget !== null);

    // Check if alive Investigator has chosen a target
    const aliveInvestigator = alivePlayers.filter(p => p.role === 'INVESTIGATOR');
    const investigatorDone = aliveInvestigator.length === 0 || aliveInvestigator[0].nightActionTarget !== null;

    // Check if alive Civilians have completed their quiz
    const aliveCivilians = alivePlayers.filter(p => p.role === 'CIVILIAN');
    const civiliansDone = aliveCivilians.every(c => c.nightQuizAnswered);

    if (mafiaDone && investigatorDone && civiliansDone) {
      this.resolveNight(teamId);
    }
  }

  forceResolveNight(teamId: string) {
    const team = this.teams.get(teamId);
    if (!team || team.currentState !== 'NIGHT') return;
    this.resolveNight(teamId);
  }

  private getFinalMafiaKillTarget(team: Team, mafiaPlayers: Player[]): string | null {
    const targets = mafiaPlayers
      .map(m => m.nightActionTarget)
      .filter((t): t is string => t !== null && t !== undefined);

    if (targets.length === 0) return null;
    if (targets.length === 1) return targets[0];

    // When 2 or more alive Mafia chose targets:
    const allSame = targets.every(t => t === targets[0]);
    if (allSame) return targets[0];

    // If targets differ:
    if (team.mafiaSelectionRule === 'AGREE_OR_NO_KILL') {
      return null;
    }

    // Otherwise, pick ONE target (e.g. first target) so there is NEVER more than 1 Mafia kill per night
    return targets[0];
  }

  private resolveNight(teamId: string) {
    const team = this.teams.get(teamId);
    if (!team) return;

    const deadThisNight = new Set<string>(); // Set of player IDs who will die

    const alivePlayers = team.players.filter(p => p.status === 'ALIVE');
    const investigator = alivePlayers.find(p => p.role === 'INVESTIGATOR');
    const mafiaPlayers = alivePlayers.filter(p => p.role === 'MAFIA');

    // 1. Resolve Investigator check
    let successfulInvestigatorReveal = '';
    if (investigator && investigator.nightActionTarget) {
      const target = team.players.find(p => p.id === investigator.nightActionTarget);
      if (target) {
        if (target.role === 'MAFIA') {
          // Mafia investigated dies immediately
          deadThisNight.add(target.id);
          target.eliminatedCause = 'INVESTIGATOR_REVEAL';
          team.investigatorResult = `${target.name} is MAFIA.`;
          successfulInvestigatorReveal = `${target.name} was revealed as MAFIA by the Investigator and was eliminated.`;
        } else {
          team.investigatorResult = `${target.name} is ${target.role}.`;
        }
      }
    }

    // 2. Resolve Mafia kills (EXACTLY ONE MAFIA KILL PER NIGHT)
    const finalMafiaTargetId = this.getFinalMafiaKillTarget(team, mafiaPlayers);
    if (finalMafiaTargetId) {
      deadThisNight.add(finalMafiaTargetId);
      const target = team.players.find(p => p.id === finalMafiaTargetId);
      if (target && !target.eliminatedCause) {
        target.eliminatedCause = 'MAFIA_KILL';
      }
    }

    // 3. Apply deaths
    const morningResults: string[] = [];
    deadThisNight.forEach(id => {
      const player = team.players.find(p => p.id === id);
      if (player) {
        player.status = 'DEAD';
        player.eliminatedRound = team.currentRound;
        if (!player.eliminatedCause) {
          player.eliminatedCause = 'OTHER';
        }

        if (player.role === 'MAFIA') {
          if (successfulInvestigatorReveal && successfulInvestigatorReveal.startsWith(player.name)) {
            morningResults.push(successfulInvestigatorReveal);
          } else {
            morningResults.push(`${player.name} was killed.`); // Generic fallback if investigator didn't do it
          }
        } else if (player.role === 'INVESTIGATOR') {
          morningResults.push(`${player.name}, the Investigator, was killed by Mafia.`);
        } else {
          morningResults.push(`${player.name} was killed by Mafia.`);
        }
      }
    });

    // If no one died
    if (deadThisNight.size === 0) {
      morningResults.push("No one was eliminated tonight.");
    }

    team.morningResults = morningResults;
    team.currentState = 'MORNING_RESULT';
    team.currentRound += 1;

    // Check win condition without immediately overriding MORNING_RESULT state
    this.checkWinCondition(teamId, false);
  }

  checkWinCondition(teamId: string, setGameCompleteImmediate: boolean = true): Team | null {
    const team = this.teams.get(teamId);
    if (!team || team.currentState === 'GAME_COMPLETE') return team || null;

    const alive = team.players.filter((p) => p.status === 'ALIVE');
    const mafiaAlive = alive.filter((p) => p.role === 'MAFIA').length;
    const civiliansAlive = alive.filter((p) => p.role === 'CIVILIAN').length;
    const investigatorAlive = alive.filter((p) => p.role === 'INVESTIGATOR').length;

    team.alivePlayers = alive.length;
    team.aliveMafia = mafiaAlive;
    team.aliveCivilians = civiliansAlive;
    team.aliveInvestigator = investigatorAlive;

    const civilianSideAlive = civiliansAlive + investigatorAlive;

    if (mafiaAlive === 0) {
      team.winner = 'CIVILIANS';
      if (setGameCompleteImmediate) team.currentState = 'GAME_COMPLETE';
      // ONLY CIVILIANS/INVESTIGATOR WHO ARE ALIVE AT THE END ADVANCE
      team.advancingPlayers = team.players
        .filter((p) => (p.role === 'CIVILIAN' || p.role === 'INVESTIGATOR') && p.status === 'ALIVE')
        .map((p) => p.id);
    } else if (mafiaAlive >= civilianSideAlive) {
      team.winner = 'MAFIA';
      if (setGameCompleteImmediate) team.currentState = 'GAME_COMPLETE';
      // ONLY MAFIA PLAYERS WHO ARE ALIVE AT THE END ADVANCE
      team.advancingPlayers = team.players
        .filter((p) => p.role === 'MAFIA' && p.status === 'ALIVE')
        .map((p) => p.id);
    }

    return team;
  }

  getSanitizedState(teamId: string, playerId: string) {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const reqPlayer = team.players.find((p) => p.id === playerId);

    // Compute alive counts dynamically (regardless of checkWinCondition)
    const alive = team.players.filter(p => p.status === 'ALIVE');
    const aliveMafia = alive.filter(p => p.role === 'MAFIA').length;
    const aliveCivilians = alive.filter(p => p.role === 'CIVILIAN').length;
    const aliveInvestigator = alive.filter(p => p.role === 'INVESTIGATOR').length;

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

    // Round 1 Question details (if applicable - strip correct answer)
    let myRound1Question = null;
    if (team.currentState === 'ROUND_1_QUESTION' && reqPlayer) {
      const questionSets = loadRound1Questions();
      const currentSet = questionSets.find(q => q.id === team.round1QuestionSetId);
      if (currentSet) {
        const fullQ = reqPlayer.role === 'MAFIA' ? currentSet.mafia : currentSet.civilian;
        myRound1Question = {
          question: fullQ.question,
          options: fullQ.options,
          type: fullQ.type,
        };
      }
    }

    // Night quiz (if applicable)
    let myNightQuiz = null;
    if (team.currentState === 'NIGHT' && reqPlayer && reqPlayer.role === 'CIVILIAN') {
      const quizzes = loadNightQuizzes();
      myNightQuiz = quizzes.find(q => q.id === team.currentNightQuizId) || null;
    }

    // Hide role during Round 1 phases (before ROLE_REVEAL)
    const round1HidePhases = new Set(['ROUND_1_QUESTION', 'ROUND_1_DISCUSSION', 'ROUND_1_VOTING', 'ROUND_1_RESULT']);
    const hideRole = round1HidePhases.has(team.currentState);

    return {
      teamId: team.teamId,
      roomCode: team.roomCode,
      maxPlayers: team.maxPlayers || 8,
      currentState: team.currentState,
      currentRound: team.currentRound,
      timerEndsAt: team.timerEndsAt,
      players: publicPlayers,
      eliminatedThisRound: team.eliminatedThisRound,
      eliminatedRoleThisRound: team.eliminatedRoleThisRound,
      voteTally: team.voteTally,
      winner: team.winner,
      alivePlayers: alive.length,
      aliveMafia,
      aliveCivilians,
      aliveInvestigator,
      advancingPlayers: team.advancingPlayers,
      morningResults: team.morningResults,
      // Private to this player
      myId: playerId,
      myRole: hideRole ? null : (reqPlayer ? reqPlayer.role : null),
      myStatus: reqPlayer ? reqPlayer.status : null,
      myMafiaPartner: hideRole ? null : mafiaPartner,
      myRound1Question,
      myNightQuiz,
      investigatorResult: reqPlayer?.role === 'INVESTIGATOR' && !hideRole ? team.investigatorResult : null,
      round1Answers:
        team.currentState === 'ROUND_1_DISCUSSION'
          ? team.players.map((p) => ({
              playerId: p.id,
              playerName: p.name,
              answerText: p.round1Answered && p.round1AnswerText && p.round1AnswerText.trim() !== '' ? p.round1AnswerText : 'No answer',
            }))
          : null,
      // Reveal roles publicly ONLY when game is complete
      revealedRoles:
        team.currentState === 'GAME_COMPLETE'
          ? team.players.map((p) => ({ id: p.id, name: p.name, role: p.role }))
          : null,
    };
  }

  loadTeamFromState(teamId: string, state: Team): void {
    this.teams.set(teamId, state);
  }
}

const globalForGame = global as unknown as { gameManager?: GameManager };
export const gameManager = globalForGame.gameManager ?? new GameManager();
globalForGame.gameManager = gameManager;
