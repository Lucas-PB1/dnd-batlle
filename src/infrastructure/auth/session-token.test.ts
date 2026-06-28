import { describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from '@/infrastructure/auth/session-token';

describe('session token', () => {
  it('preserves roles array in JWT', async () => {
    const session = {
      userId: '1',
      email: 'test@test.local',
      username: 'test',
      roles: ['admin', 'judge', 'player'] as const,
      displayName: 'Test',
    };

    const token = await createSessionToken({
      ...session,
      roles: [...session.roles],
    });
    const verified = await verifySessionToken(token);

    expect(verified?.roles).toEqual(['admin', 'judge', 'player']);
  });
});
