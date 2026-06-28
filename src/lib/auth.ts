import { cookies } from 'next/headers';
import type { SessionPayload, UserRole } from '@/domain/entities';
import { verifySessionToken } from '@/infrastructure/auth/session-token';
import { SESSION_COOKIE } from '@/shared/constants/game-rules';
import { hasAnyRole, normalizeRoles } from '@/shared/utils/roles';

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  return {
    ...session,
    roles: normalizeRoles(session.roles ?? (session as SessionPayload & { role?: UserRole }).role),
  };
}

export async function requireSession(roles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Não autenticado');
  }
  if (roles && !hasAnyRole(session, roles)) {
    throw new Error('Sem permissão');
  }
  return session;
}
