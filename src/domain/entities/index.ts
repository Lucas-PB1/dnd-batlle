export type UserRole = 'admin' | 'judge';

export type Bracket = 'A' | 'B' | 'C';

export type DuelStatus = 'open' | 'ready' | 'completed';

export type DuelOutcome = 'player_a' | 'player_b' | 'draw';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  active: boolean;
  createdAt: string;
}

export interface PlayerEntry {
  name: string;
  characterClass: string;
  subclass?: string;
  bracket: Bracket;
  seasonPointsBefore: number;
}

export interface DuelResult {
  outcome: DuelOutcome;
  rounds: number;
  pointsA: number;
  pointsB: number;
  notes?: string;
}

export interface Duel {
  id: string;
  token: string;
  judgeId: string;
  judgeName: string;
  status: DuelStatus;
  isClassified: boolean;
  arena?: number;
  playerA?: PlayerEntry;
  playerB?: PlayerEntry;
  result?: DuelResult;
  createdAt: string;
  completedAt?: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
}

export interface RankingEntry {
  name: string;
  characterClass: string;
  bracket: Bracket;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  duels: number;
}

export interface ClassStats {
  characterClass: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

export interface PublicStats {
  ranking: RankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
}

export interface CompletedDuelSummary {
  id: string;
  playerAName: string;
  playerBName: string;
  playerAClass: string;
  playerBClass: string;
  outcome: DuelOutcome;
  arena?: number;
  rounds: number;
  completedAt: string;
  isClassified: boolean;
}
