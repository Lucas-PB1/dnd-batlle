import { cookies } from 'next/headers';
import type { SessionPayload } from '@/domain/entities';
import { verifySessionToken } from '@/infrastructure/auth/session-token';
import { SESSION_COOKIE } from '@/shared/constants/game-rules';

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(
  roles?: SessionPayload['role'][],
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Não autenticado');
  }
  if (roles && !roles.includes(session.role)) {
    throw new Error('Sem permissão');
  }
  return session;
}
