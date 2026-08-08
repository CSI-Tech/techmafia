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

export type PublicPlayer = {
  id: string;
  name: string;
  status: PlayerStatus;
  voted: boolean;
};

export type VoteTally = {
  name: string;
  count: number;
};

export type SanitizedGameState = {
  teamId: string;
  roomCode: string;
  currentState: GameState;
  currentRound: number;
  timerEndsAt: number | null;
  players: PublicPlayer[];
  eliminatedThisRound: string | null;
  eliminatedRoleThisRound: Role;
  voteTally: VoteTally[];
  winner: 'CIVILIANS' | 'MAFIA' | null;

  // Current player's private info
  myId: string;
  myRole: Role;
  myWord: string | null;
  myStatus: PlayerStatus | null;
  myMafiaPartner: string | null;

  // Only populated at game end
  revealedRoles: { name: string; role: Role }[] | null;
};

// Dummy export to prevent "empty module" issue with isolatedModules
export const __types = true;
