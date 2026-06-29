import type { Arena } from '@/domain/entities';

export function sortArenas(arenas: Arena[]): Arena[] {
  return [...arenas].sort((a, b) => a.sortOrder - b.sortOrder || a.diceValue - b.diceValue);
}

export function getArenaLabel(arenas: Arena[], diceValue?: number): string {
  if (diceValue == null) return '—';
  const arena = arenas.find((item) => item.diceValue === diceValue);
  return arena ? arena.name : `Arena ${diceValue}`;
}

export function getArenaByDice(arenas: Arena[], diceValue: number): Arena | undefined {
  return arenas.find((arena) => arena.diceValue === diceValue);
}
