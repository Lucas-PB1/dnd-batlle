import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

describe('DuelService integration', () => {
  let dataDir: string;

  beforeEach(async () => {
    ServiceFactory.reset();
    dataDir = await mkdtemp(path.join(tmpdir(), 'arena-duel-'));
  });

  afterEach(async () => {
    ServiceFactory.reset();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('creates duel, registers players and completes with scoring', async () => {
    const factory = ServiceFactory.create(dataDir);
    const adminService = factory.getAdminService();
    const authService = factory.getAuthService();
    const duelService = factory.getDuelService();

    await authService.ensureDefaultAdmin();
    const judge = await adminService.createJudge({
      username: 'juiz1',
      password: '1234',
      displayName: 'Juiz Teste',
    });

    const duel = await duelService.createDuel({
      judgeId: judge.id,
      isClassified: true,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'A',
      name: 'Aragorn',
      characterClass: 'Lutador',
      seasonPointsBefore: 0,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'B',
      name: 'Gandalf',
      characterClass: 'Mago',
      seasonPointsBefore: 0,
    });

    const completed = await duelService.completeDuel({
      duelId: duel.id,
      judgeId: judge.id,
      arena: 6,
      outcome: 'player_a',
      rounds: 12,
    });

    expect(completed.status).toBe('completed');
    expect(completed.result?.pointsA).toBe(4);
    expect(completed.result?.pointsB).toBe(0);

    const stats = await factory.getRankingService().getPublicStats();
    expect(stats.totalDuels).toBe(1);
    expect(stats.ranking[0]?.name).toBe('Aragorn');
    expect(stats.ranking[0]?.points).toBe(4);
  });
});
