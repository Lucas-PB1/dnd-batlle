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
      actorId: judge.id,
      roles: ['judge'],
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

  it('updates completed duel glory and deletes duel from ranking', async () => {
    const factory = ServiceFactory.create(dataDir);
    const adminService = factory.getAdminService();
    const authService = factory.getAuthService();
    const duelService = factory.getDuelService();
    const characterService = factory.getCharacterService();

    await authService.ensureDefaultAdmin();
    const judge = await adminService.createJudge({
      email: 'juiz2@test.local',
      password: '1234',
      displayName: 'Juiz 2',
    });

    const playerRegister = await authService.register({
      email: 'legolas@test.local',
      password: '1234',
      displayName: 'Legolas Player',
    });

    const character = await characterService.create({
      playerId: playerRegister.id,
      name: 'Legolas',
      characterClass: 'Patrulheiro',
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
      name: 'Orc',
      characterClass: 'Lutador',
    });

    const completed = await duelService.completeDuel({
      duelId: duel.id,
      actorId: judge.id,
      roles: ['judge'],
      arena: 2,
      outcome: 'player_a',
      rounds: 8,
    });

    expect(completed.result?.pointsA).toBe(3);

    const updated = await duelService.updateDuel({
      duelId: duel.id,
      actorId: judge.id,
      roles: ['judge'],
      pointsA: 5,
      pointsB: 0,
    });

    expect(updated.result?.pointsA).toBe(5);

    let stats = await factory.getRankingService().getPublicStats();
    expect(stats.characterRanking.find((entry) => entry.characterName === 'Legolas')?.points).toBe(
      5,
    );

    await duelService.deleteDuel({
      duelId: duel.id,
      actorId: judge.id,
      roles: ['judge'],
    });

    stats = await factory.getRankingService().getPublicStats();
    expect(stats.totalDuels).toBe(0);
    expect(stats.characterRanking.find((entry) => entry.characterName === 'Legolas')?.points).toBe(0);
  });

  it('soft deletes character from player roster', async () => {
    const factory = ServiceFactory.create(dataDir);
    const authService = factory.getAuthService();
    const characterService = factory.getCharacterService();

    await authService.ensureDefaultAdmin();
    const player = await authService.register({
      email: 'sam@test.local',
      password: '1234',
      displayName: 'Sam',
    });

    const character = await characterService.create({
      playerId: player.id,
      name: 'Frodo',
      characterClass: 'Ladino',
    });

    await characterService.delete(character.id, { userId: player.id, roles: ['player'] });

    const roster = await characterService.listByPlayer(player.id);
    expect(roster).toHaveLength(0);
  });

  it('blocks registering the same character on both slots', async () => {
    const factory = ServiceFactory.create(dataDir);
    const adminService = factory.getAdminService();
    const authService = factory.getAuthService();
    const duelService = factory.getDuelService();
    const characterService = factory.getCharacterService();

    await authService.ensureDefaultAdmin();
    const judge = await adminService.createJudge({
      email: 'juiz3@test.local',
      password: '1234',
      displayName: 'Juiz 3',
    });

    const player = await authService.register({
      email: 'hero2@test.local',
      password: '1234',
      displayName: 'Hero 2',
    });

    const character = await characterService.create({
      playerId: player.id,
      name: 'Twin',
      characterClass: 'Paladino',
    });

    const duel = await duelService.createDuel({
      judgeId: judge.id,
      isClassified: true,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'A',
      characterId: character.id,
      playerId: player.id,
    });

    await expect(
      duelService.registerPlayer({
        token: duel.token,
        slot: 'B',
        characterId: character.id,
        playerId: player.id,
      }),
    ).rejects.toThrow('Este herói já está inscrito no outro lado da arena');
  });

  it('allows another judge to edit a completed duel', async () => {
    const factory = ServiceFactory.create(dataDir);
    const adminService = factory.getAdminService();
    const authService = factory.getAuthService();
    const duelService = factory.getDuelService();
    const characterService = factory.getCharacterService();

    await authService.ensureDefaultAdmin();
    const judgeA = await adminService.createJudge({
      email: 'juiz-a@test.local',
      password: '1234',
      displayName: 'Juiz A',
    });
    const judgeB = await adminService.createJudge({
      email: 'juiz-b@test.local',
      password: '1234',
      displayName: 'Juiz B',
    });

    const player = await authService.register({
      email: 'hero3@test.local',
      password: '1234',
      displayName: 'Hero 3',
    });

    const character = await characterService.create({
      playerId: player.id,
      name: 'Ranger',
      characterClass: 'Patrulheiro',
    });

    const duel = await duelService.createDuel({
      judgeId: judgeA.id,
      isClassified: true,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'A',
      characterId: character.id,
      playerId: player.id,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'B',
      name: 'Mob',
      characterClass: 'Lutador',
    });

    await duelService.completeDuel({
      duelId: duel.id,
      actorId: judgeA.id,
      roles: ['judge'],
      arena: 1,
      outcome: 'player_a',
      rounds: 5,
    });

    const updated = await duelService.updateDuel({
      duelId: duel.id,
      actorId: judgeB.id,
      roles: ['judge'],
      pointsA: 4,
      pointsB: 0,
    });

    expect(updated.result?.pointsA).toBe(4);
  });

  it('blocks another judge from completing an in-progress duel', async () => {
    const factory = ServiceFactory.create(dataDir);
    const adminService = factory.getAdminService();
    const authService = factory.getAuthService();
    const duelService = factory.getDuelService();

    await authService.ensureDefaultAdmin();
    const judgeA = await adminService.createJudge({
      email: 'juiz-c@test.local',
      password: '1234',
      displayName: 'Juiz C',
    });
    const judgeB = await adminService.createJudge({
      email: 'juiz-d@test.local',
      password: '1234',
      displayName: 'Juiz D',
    });

    const duel = await duelService.createDuel({
      judgeId: judgeA.id,
      isClassified: true,
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'A',
      name: 'A',
      characterClass: 'Lutador',
    });

    await duelService.registerPlayer({
      token: duel.token,
      slot: 'B',
      name: 'B',
      characterClass: 'Mago',
    });

    await expect(
      duelService.completeDuel({
        duelId: duel.id,
        actorId: judgeB.id,
        roles: ['judge'],
        arena: 1,
        outcome: 'player_a',
        rounds: 3,
      }),
    ).rejects.toThrow('Sem permissão');
  });

  it('allows admin to edit any character', async () => {
    const factory = ServiceFactory.create(dataDir);
    const authService = factory.getAuthService();
    const adminService = factory.getAdminService();
    const characterService = factory.getCharacterService();

    await authService.ensureDefaultAdmin();
    const admin = (await adminService.listUsers()).find((user) => user.roles.includes('admin'));
    if (!admin) throw new Error('Admin not found');

    const player = await authService.register({
      email: 'edit@test.local',
      password: '1234',
      displayName: 'Edit Player',
    });

    const character = await characterService.create({
      playerId: player.id,
      name: 'Old Name',
      characterClass: 'Ladino',
    });

    const updated = await characterService.update(
      character.id,
      { userId: admin.id, roles: ['admin'] },
      { name: 'New Name' },
    );

    expect(updated.name).toBe('New Name');
  });
});
