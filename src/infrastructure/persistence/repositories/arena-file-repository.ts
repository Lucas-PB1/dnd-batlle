import type { Arena } from '@/domain/entities';
import type { IArenaRepository } from '@/domain/repositories';
import { FileStore } from '@/infrastructure/persistence/file-store';

export class ArenaFileRepository implements IArenaRepository {
  private readonly fileName = 'arenas.json';

  constructor(private readonly store: FileStore) {}

  private async readAll(): Promise<Arena[]> {
    return this.store.read<Arena[]>(this.fileName, []);
  }

  async findAll(): Promise<Arena[]> {
    const arenas = await this.readAll();
    return arenas.sort((a, b) => a.sortOrder - b.sortOrder || a.diceValue - b.diceValue);
  }

  async findById(id: string): Promise<Arena | null> {
    const arenas = await this.readAll();
    return arenas.find((arena) => arena.id === id) ?? null;
  }

  async findByDiceValue(diceValue: number): Promise<Arena | null> {
    const arenas = await this.readAll();
    return arenas.find((arena) => arena.diceValue === diceValue) ?? null;
  }

  async save(arena: Arena): Promise<Arena> {
    const arenas = await this.readAll();
    arenas.push(arena);
    await this.store.write(this.fileName, arenas);
    return arena;
  }

  async update(arena: Arena): Promise<Arena> {
    const arenas = await this.readAll();
    const index = arenas.findIndex((item) => item.id === arena.id);
    if (index === -1) throw new Error('Arena não encontrada');
    arenas[index] = arena;
    await this.store.write(this.fileName, arenas);
    return arena;
  }
}
