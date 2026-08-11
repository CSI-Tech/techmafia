import { GameState, Role, PlayerStatus, PublicPlayer, VoteTally } from '@/types';

export interface Player {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  status: PlayerStatus;
  eliminatedRound?: number;
  
  // Game flow details
  round1Answered?: boolean;
  round1AnswerCorrect?: boolean;
  nightQuizAnswered?: boolean;
  nightActionTarget?: string | null; // target player ID (for Mafia kill / Investigator check)
}

export interface Team {
  teamId: string;
  roomCode: string;
  players: Player[];
  currentState: GameState;
  currentRound: number;
  timerEndsAt: number | null;
  votes: Record<string, string>; // voterId -> voted name
  eliminatedThisRound: string | null;
  eliminatedRoleThisRound: Role;
  voteTally: VoteTally[];
  winner: 'CIVILIANS' | 'MAFIA' | null;
  alivePlayers: number;
  aliveMafia: number;
  aliveCivilians: number;
  aliveInvestigator: number;
  advancingPlayers: string[];
  createdAt: string;

  // New Step 2 state variables
  round1QuestionSetId: string | null;
  currentNightQuizId: string | null;
  investigatorResult: string | null; // private message for the investigator
  morningResults: string[]; // public events for morning announcement
  
  // Configurations
  tieRule: 'NO_ELIMINATION' | 'RANDOM_ELIMINATION';
  mafiaSelectionRule: 'KILL_ALL' | 'AGREE_OR_NO_KILL';
}
