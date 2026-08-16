export type GameState =
  | 'WAITING_FOR_PLAYERS'
  | 'READY'
  | 'ROLE_ASSIGNMENT'
  | 'ROUND_1_QUESTION'
  | 'ROUND_1_DISCUSSION'
  | 'ROUND_1_VOTING'
  | 'ROUND_1_RESULT'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'MORNING_RESULT'
  | 'ROUND_2_DISCUSSION'
  | 'ROUND_2_VOTING'
  | 'ROUND_RESULT'
  | 'GAME_COMPLETE';

export type Role = 'CIVILIAN' | 'MAFIA' | 'INVESTIGATOR' | null;
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

export type QuestionData = {
  type?: 'MULTIPLE_CHOICE' | 'TYPE_ANSWER';
  question: string;
  options?: string[];
  answer: string;
};

export type SanitizedGameState = {
  teamId: string;
  roomCode: string;
  maxPlayers: number;
  currentState: GameState;
  currentRound: number;
  timerEndsAt: number | null;
  players: PublicPlayer[];
  eliminatedThisRound: string | null;
  eliminatedRoleThisRound: Role;
  voteTally: VoteTally[];
  winner: 'CIVILIANS' | 'MAFIA' | null;
  alivePlayers: number;
  aliveMafia: number;
  aliveCivilians: number;
  aliveInvestigator: number;
  advancingPlayers: string[];
  morningResults: string[];

  // Current player's private info
  myId: string;
  myRole: Role;
  myStatus: PlayerStatus | null;
  myMafiaPartner: string | null;
  myRound1Question: QuestionData | null;
  myNightQuiz: QuestionData | null;
  investigatorResult: string | null;

  // Only populated at game end
  revealedRoles: { id: string; name: string; role: Role }[] | null;
};

// Dummy export to prevent "empty module" issue with isolatedModules
export const __types = true;

// ── Admin-only types ──────────────────────────────────────────────────────────

export type RoomStatus = 'WAITING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED';

export type AdminPlayer = {
  id?: string;
  name: string;
  role: Role;
  status: PlayerStatus;
  eliminatedRound?: number;
  eliminatedCause?: string;
  nightQuizAnswered?: boolean;
  nightActionTarget?: string | null;
  targetPlayerName?: string | null;
};

/** Full team snapshot pushed over admin Socket.IO namespace */
export type AdminTeamUpdate = {
  teamId: string;
  roomCode: string;
  loginCode?: string;
  maxPlayers?: number;
  currentState: GameState;
  currentRound: number;
  timerEndsAt: number | null;
  winner: 'CIVILIANS' | 'MAFIA' | null;
  players: AdminPlayer[];
  aliveCount: number;
  deadCount: number;
  eliminatedThisRound: string | null;
  eliminatedRoleThisRound: Role;
  advancingPlayers: string[];
};

/** Team record returned from REST /api/admin/teams */
export type AdminTeam = {
  _id: string;
  teamId: string;
  roomCode: string;
  loginCode?: string;
  teamNumber: string;
  maxPlayers?: number;
  status: RoomStatus;
  createdAt: string;
  completedAt?: string;
  winner?: 'CIVILIANS' | 'MAFIA' | null;
  rounds: number;
  playerNames: string[];
  eliminationHistory: { round: number; playerName: string; role: string }[];
  advancingPlayerNames: string[];
  playerRoles?: { name: string; role: string }[];
  live: AdminTeamUpdate | null;
};

export type GameLogEntry = {
  _id: string;
  teamId: string;
  roomCode: string;
  round: number;
  event: string;
  detail?: string;
  timestamp: string;
};

