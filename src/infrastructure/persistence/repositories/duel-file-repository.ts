import type { Duel } from '@/domain/entities';
import type { IDuelRepository } from '@/domain/repositories';
import { FileStore } from '@/infrastructure/persistence/file-store';

export class DuelFileRepository implements IDuelRepository {
  private readonly fileName = 'duels.json';

  constructor(private readonly store: FileStore) {}

  async findAll(): Promise<Duel[]> {
    return this.store.read<Duel[]>(this.fileName, []);
  }

  async findById(id: string): Promise<Duel | null> {
    const duels = await this.findAll();
    return duels.find((duel) => duel.id === id) ?? null;
  }

  async findByToken(token: string): Promise<Duel | null> {
    const duels = await this.findAll();
    return duels.find((duel) => duel.token === token) ?? null;
  }

  async save(duel: Duel): Promise<Duel> {
    const duels = await this.findAll();
    duels.push(duel);
    await this.store.write(this.fileName, duels);
    return duel;
  }

  async update(duel: Duel): Promise<Duel> {
    const duels = await this.findAll();
    const index = duels.findIndex((item) => item.id === duel.id);
    if (index === -1) {
      throw new Error('Duelo não encontrado');
    }
    duels[index] = duel;
    await this.store.write(this.fileName, duels);
    return duel;
  }

  async delete(id: string): Promise<void> {
    const duels = await this.findAll();
    const next = duels.filter((duel) => duel.id !== id);
    if (next.length === duels.length) {
      throw new Error('Duelo não encontrado');
    }
    await this.store.write(this.fileName, next);
  }
}
