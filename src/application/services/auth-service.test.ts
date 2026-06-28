import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

describe('AuthService', () => {
  let dataDir: string;

  beforeEach(async () => {
    ServiceFactory.reset();
    dataDir = await mkdtemp(path.join(tmpdir(), 'arena-duel-auth-'));
  });

  afterEach(async () => {
    ServiceFactory.reset();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('creates default admin when database is empty', async () => {
    const auth = ServiceFactory.create(dataDir).getAuthService();
    const result = await auth.login('admin', 'admin123');
    expect(result?.session.roles).toContain('admin');
  });

  it('still creates admin after a player registers first', async () => {
    const factory = ServiceFactory.create(dataDir);
    const auth = factory.getAuthService();

    await auth.register({
      email: 'early@test.local',
      password: '1234',
      displayName: 'Early Player',
    });

    const adminLogin = await auth.login('admin', 'admin123');
    expect(adminLogin?.session.roles).toContain('admin');

    const playerLogin = await auth.login('early@test.local', '1234');
    expect(playerLogin?.session.roles).toContain('player');
  });

  it('logs in with email and username', async () => {
    const auth = ServiceFactory.create(dataDir).getAuthService();
    await auth.login('admin', 'admin123');

    const byEmail = await auth.login('admin@arena.local', 'admin123');
    const byUsername = await auth.login('admin', 'admin123');

    expect(byEmail?.session.userId).toBe(byUsername?.session.userId);
  });
});
