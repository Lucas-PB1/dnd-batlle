import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

describe('ArenaService', () => {
  let dataDir: string;

  beforeEach(async () => {
    ServiceFactory.reset();
    dataDir = await mkdtemp(path.join(tmpdir(), 'arena-duel-'));
  });

  afterEach(async () => {
    ServiceFactory.reset();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('seeds default arenas and creates custom arena', async () => {
    const service = ServiceFactory.create(dataDir).getArenaService();
    const defaults = await service.listAll();
    expect(defaults.length).toBeGreaterThanOrEqual(6);

    const custom = await service.create({
      diceValue: 7,
      name: 'Lava',
      effect: 'Fim de turno em contato → 1d6 fogo',
      description: 'Chão vulcânico',
    });

    expect(custom.diceValue).toBe(7);
    await expect(service.assertValidDiceValue(7)).resolves.toMatchObject({ name: 'Lava' });
  });
});
