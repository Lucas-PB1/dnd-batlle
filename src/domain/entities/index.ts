export type UserRole = 'admin' | 'judge' | 'player';

export type Bracket = 'A' | 'B' | 'C';

export type DuelStatus = 'open' | 'ready' | 'completed';

export type DuelOutcome = 'player_a' | 'player_b' | 'draw';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  roles: UserRole[];
  displayName: string;
  active: boolean;
  deletedAt?: string;
  archivedEmail?: string;
  createdAt: string;
}

export interface Character {
  id: string;
  playerId: string;
  name: string;
  characterClass: string;
  subclass?: string;
  description?: string;
  portraitUrl?: string;
  generation?: string;
  isDead: boolean;
  active: boolean;
  createdAt: string;
}

export interface PlayerEntry {
  characterId?: string;
  playerId?: string;
  playerDisplayName?: string;
  name: string;
  characterClass: string;
  subclass?: string;
  description?: string;
  portraitUrl?: string;
  generation?: string;
  isDead?: boolean;
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
  email: string;
  username: string;
  roles: UserRole[];
  displayName: string;
}

export interface CharacterRankingEntry {
  characterId?: string;
  characterName: string;
  playerId?: string;
  playerDisplayName?: string;
  characterClass: string;
  subclass?: string;
  description?: string;
  bracket: Bracket;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  duels: number;
}

export interface PlayerRankingEntry {
  playerId: string;
  playerDisplayName: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  duels: number;
  characters: number;
}

/** @deprecated Use characterRanking */
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
  characterRanking: CharacterRankingEntry[];
  playerRanking: PlayerRankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
}

export interface PlayerStats {
  playerRanking: PlayerRankingEntry | null;
  characterRanking: CharacterRankingEntry[];
  recentDuels: CompletedDuelSummary[];
}

export interface CompletedDuelSummary {
  id: string;
  playerAName: string;
  playerBName: string;
  playerAClass: string;
  playerBClass: string;
  playerADisplayName?: string;
  playerBDisplayName?: string;
  outcome: DuelOutcome;
  arena?: number;
  rounds: number;
  completedAt: string;
  isClassified: boolean;
}
