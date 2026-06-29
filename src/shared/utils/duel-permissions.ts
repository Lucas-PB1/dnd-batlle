import type { Duel, UserRole } from '@/domain/entities';

export function canViewDuel(duel: Duel, actorId: string, roles: UserRole[]): boolean {
  if (roles.includes('admin')) return true;
  if (!roles.includes('judge')) return false;
  if (duel.status === 'completed') return true;
  return duel.judgeId === actorId;
}

export function canManageDuel(duel: Duel, actorId: string, roles: UserRole[]): boolean {
  if (roles.includes('admin')) return true;
  if (!roles.includes('judge')) return false;
  if (duel.status === 'completed') return true;
  return duel.judgeId === actorId;
}

export function canCompleteDuel(duel: Duel, actorId: string, roles: UserRole[]): boolean {
  if (roles.includes('admin')) return true;
  return roles.includes('judge') && duel.judgeId === actorId;
}

export function canDeleteDuel(duel: Duel, actorId: string, roles: UserRole[]): boolean {
  if (roles.includes('admin')) return true;
  return roles.includes('judge') && duel.judgeId === actorId;
}
