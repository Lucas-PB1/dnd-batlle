import { SignJWT, jwtVerify } from 'jose';
import type { SessionPayload } from '@/domain/entities';
import { SESSION_MAX_AGE } from '@/shared/constants/game-rules';

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'arena-duel-dev-secret-change-in-production',
);

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
