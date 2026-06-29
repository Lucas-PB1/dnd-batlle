import type { Character, Duel, DuelResult, PlayerEntry, User, UserRole } from '@/domain/entities';
import { normalizeRoles } from '@/shared/utils/roles';

export interface UserRow {
  id: string;
  email: string | null;
  username: string;
  password_hash: string;
  role?: string | null;
  roles?: UserRole[] | string | null;
  display_name: string;
  active: boolean;
  deleted_at?: string | Date | null;
  archived_email?: string | null;
  created_at: string | Date;
}

export interface CharacterRow {
  id: string;
  player_id: string;
  name: string;
  character_class: string;
  subclass: string | null;
  description: string | null;
  portrait_url: string | null;
  generation: string | null;
  is_dead: boolean;
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

function parseRoles(row: UserRow): UserRole[] {
  if (row.roles) {
    if (typeof row.roles === 'string') {
      return normalizeRoles(JSON.parse(row.roles) as UserRole[]);
    }
    return normalizeRoles(row.roles);
  }
  if (row.role) {
    return normalizeRoles(row.role as UserRole);
  }
  return ['player'];
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email ?? `${row.username}@arena.local`,
    username: row.username,
    passwordHash: row.password_hash,
    roles: parseRoles(row),
    displayName: row.display_name,
    active: row.active,
    deletedAt: row.deleted_at ? toIsoString(row.deleted_at) : undefined,
    archivedEmail: row.archived_email ?? undefined,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapCharacterRow(row: CharacterRow): Character {
  return {
    id: row.id,
    playerId: row.player_id,
    name: row.name,
    characterClass: row.character_class,
    subclass: row.subclass ?? undefined,
    description: row.description ?? undefined,
    portraitUrl: row.portrait_url ?? undefined,
    generation: row.generation ?? undefined,
    isDead: row.is_dead,
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

/** Normaliza usuários legados (campo role único) vindos de JSON local. */
export function normalizeLegacyUser(raw: User & { role?: UserRole }): User {
  if (raw.roles?.length) {
    return {
      ...raw,
      email: raw.email ?? `${raw.username}@arena.local`,
      roles: normalizeRoles(raw.roles),
    };
  }
  if (raw.role) {
    return {
      ...raw,
      email: raw.email ?? `${raw.username}@arena.local`,
      roles: normalizeRoles(raw.role),
    };
  }
  return {
    ...raw,
    email: raw.email ?? `${raw.username}@arena.local`,
    roles: ['player'],
  };
}
