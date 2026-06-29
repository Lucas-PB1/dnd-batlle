import { randomUUID } from 'crypto';
import type { IArenaRepository } from '@/domain/repositories';
import type { Arena } from '@/domain/entities';
import { DEFAULT_ARENAS } from '@/shared/constants/arena-defaults';

export interface CreateArenaInput {
  diceValue: number;
  name: string;
  effect: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateArenaInput {
  diceValue?: number;
  name?: string;
  effect?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export class ArenaService {
  constructor(private readonly arenaRepository: IArenaRepository) {}

  async listAll(includeInactive = false): Promise<Arena[]> {
    await this.ensureDefaults();
    const arenas = await this.arenaRepository.findAll();
    return includeInactive ? arenas : arenas.filter((arena) => arena.active);
  }

  async getByDiceValue(diceValue: number): Promise<Arena | null> {
    await this.ensureDefaults();
    return this.arenaRepository.findByDiceValue(diceValue);
  }

  async assertValidDiceValue(diceValue: number): Promise<Arena> {
    const arena = await this.getByDiceValue(diceValue);
    if (!arena || !arena.active) {
      throw new Error('Arena inválida ou inativa');
    }
    return arena;
  }

  async create(input: CreateArenaInput): Promise<Arena> {
    await this.ensureDefaults();
    await this.assertUniqueDiceValue(input.diceValue);

    const arenas = await this.arenaRepository.findAll();
    const arena: Arena = {
      id: randomUUID(),
      diceValue: input.diceValue,
      name: input.name.trim(),
      effect: input.effect.trim(),
      description: input.description?.trim() || undefined,
      sortOrder: input.sortOrder ?? arenas.length + 1,
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };

    return this.arenaRepository.save(arena);
  }

  async update(arenaId: string, input: UpdateArenaInput): Promise<Arena> {
    const arena = await this.arenaRepository.findById(arenaId);
    if (!arena) throw new Error('Arena não encontrada');

    const diceValue = input.diceValue ?? arena.diceValue;
    if (diceValue !== arena.diceValue) {
      await this.assertUniqueDiceValue(diceValue, arenaId);
    }

    const updated: Arena = {
      ...arena,
      diceValue,
      name: input.name?.trim() ?? arena.name,
      effect: input.effect?.trim() ?? arena.effect,
      description:
        input.description === null
          ? undefined
          : input.description?.trim() ?? arena.description,
      sortOrder: input.sortOrder ?? arena.sortOrder,
      active: input.active ?? arena.active,
    };

    return this.arenaRepository.update(updated);
  }

  async delete(arenaId: string): Promise<Arena> {
    return this.update(arenaId, { active: false });
  }

  getMaxDiceValue(arenas: Arena[]): number {
    const active = arenas.filter((arena) => arena.active);
    if (!active.length) return 6;
    return Math.max(...active.map((arena) => arena.diceValue));
  }

  resolveArena(arenas: Arena[], diceValue: number): Arena | undefined {
    const active = arenas.filter((arena) => arena.active);
    return (
      active.find((arena) => arena.diceValue === diceValue) ??
      active.sort((a, b) => a.diceValue - b.diceValue)[0]
    );
  }

  private async ensureDefaults(): Promise<void> {
    const arenas = await this.arenaRepository.findAll();
    if (arenas.length > 0) return;

    const now = new Date().toISOString();
    for (const seed of DEFAULT_ARENAS) {
      await this.arenaRepository.save({
        id: randomUUID(),
        diceValue: seed.diceValue,
        name: seed.name,
        effect: seed.effect,
        description: seed.description,
        sortOrder: seed.sortOrder,
        active: true,
        createdAt: now,
      });
    }
  }

  private async assertUniqueDiceValue(diceValue: number, ignoreId?: string): Promise<void> {
    const existing = await this.arenaRepository.findByDiceValue(diceValue);
    if (existing && existing.id !== ignoreId) {
      throw new Error(`Já existe uma arena com dado ${diceValue}`);
    }
  }
}
