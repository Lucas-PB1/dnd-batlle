import type { Arena } from '@/domain/entities';

export interface ArenaRow {
  id: string;
  dice_value: number;
  name: string;
  effect: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string | Date;
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function mapArenaRow(row: ArenaRow): Arena {
  return {
    id: row.id,
    diceValue: row.dice_value,
    name: row.name,
    effect: row.effect,
    description: row.description ?? undefined,
    sortOrder: row.sort_order,
    active: row.active,
    createdAt: toIsoString(row.created_at),
  };
}
