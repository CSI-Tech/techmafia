export type GameState = 
  | 'WAITING_FOR_PLAYERS'
  | 'READY'
  | 'ROLE_REVEAL'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_RESULT'
  | 'ELIMINATION'
  | 'GAME_COMPLETE';

export type Role = 'CIVILIAN' | 'MAFIA' | null;
export type PlayerStatus = 'ALIVE' | 'DEAD';

export interface Player {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  status: PlayerStatus;
}

export interface PublicPlayer {
  id: string;
  name: string;
  status: PlayerStatus;
  voted: boolean;
}

export interface VoteTally {
  name: string; // Player name or 'NO_VOTE'
  count: number;
}

export interface Team {
  teamId: string;
  roomCode: string;
  players: Player[];
  currentState: GameState;
  currentRound: number;
  timerEndsAt: number | null;
  votes: Record<string, string>; // voterId -> voted name or 'NO_VOTE'
  eliminatedThisRound: string | null;
  eliminatedRoleThisRound: Role;
  voteTally: VoteTally[];
  winner: 'CIVILIANS' | 'MAFIA' | null;
}
