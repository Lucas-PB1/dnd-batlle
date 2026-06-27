import type { Duel, DuelResult, PlayerEntry, User, UserRole } from '@/domain/entities';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  display_name: string;
  active: boolean;
  created_at: string | Date;
}

export interface DuelRow {
  id: string;
  token: string;
  judge_id: string;
  judge_name: string;
  status: Duel['status'];
  is_classified: boolean;
  arena: number | null;
  player_a: PlayerEntry | null;
  player_b: PlayerEntry | null;
  result: DuelResult | null;
  created_at: string | Date;
  completed_at: string | Date | null;
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    displayName: row.display_name,
    active: row.active,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapDuelRow(row: DuelRow): Duel {
  return {
    id: row.id,
    token: row.token,
    judgeId: row.judge_id,
    judgeName: row.judge_name,
    status: row.status,
    isClassified: row.is_classified,
    arena: row.arena ?? undefined,
    playerA: row.player_a ?? undefined,
    playerB: row.player_b ?? undefined,
    result: row.result ?? undefined,
    createdAt: toIsoString(row.created_at),
    completedAt: row.completed_at ? toIsoString(row.completed_at) : undefined,
  };
}
