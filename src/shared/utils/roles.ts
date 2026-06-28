import type { SessionPayload, User, UserRole } from '@/domain/entities';

export function hasRole(user: Pick<User | SessionPayload, 'roles'>, role: UserRole): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(
  user: Pick<User | SessionPayload, 'roles'>,
  roles: UserRole[],
): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function normalizeRoles(roleOrRoles: UserRole | UserRole[] | undefined): UserRole[] {
  if (!roleOrRoles) return ['player'];
  return Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
}

export function primaryRedirectRole(roles: UserRole[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('judge')) return '/judge';
  if (roles.includes('player')) return '/player';
  return '/';
}
