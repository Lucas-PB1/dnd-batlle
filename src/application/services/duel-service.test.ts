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
    const characterService = factory.getCharacterService();

    await authService.ensureDefaultAdmin();
    const judge = await adminService.createJudge({
      email: 'juiz@test.local',
      password: '1234',
      displayName: 'Juiz Teste',
    });

    const playerRegister = await authService.register({
      email: 'aragorn@test.local',
      password: '1234',
      displayName: 'Aragorn Player',
    });

    const character = await characterService.create({
      playerId: playerRegister.id,
      name: 'Aragorn',
      characterClass: 'Lutador',
    });

    const duel = await duelService.createDuel({
      judgeId: judge.id,
      isClassified: true,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'A',
      characterId: character.id,
      playerId: playerRegister.id,
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
    expect(completed.playerA?.playerDisplayName).toBe('Aragorn Player');

    const stats = await factory.getRankingService().getPublicStats();
    expect(stats.totalDuels).toBe(1);
    expect(stats.characterRanking[0]?.characterName).toBe('Aragorn');
    expect(stats.playerRanking[0]?.playerDisplayName).toBe('Aragorn Player');
  });
});
