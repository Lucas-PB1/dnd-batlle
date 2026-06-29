import type { Character } from '@/domain/entities';
import type { ICharacterRepository } from '@/domain/repositories';
import { FileStore } from '@/infrastructure/persistence/file-store';

export class CharacterFileRepository implements ICharacterRepository {
  private readonly fileName = 'characters.json';

  constructor(private readonly store: FileStore) {}

  async findAll(): Promise<Character[]> {
    return this.store.read<Character[]>(this.fileName, []);
  }

  async findById(id: string): Promise<Character | null> {
    const characters = await this.findAll();
    return characters.find((character) => character.id === id) ?? null;
  }

  async findByPlayerId(playerId: string): Promise<Character[]> {
    const characters = await this.findAll();
    return characters.filter((character) => character.playerId === playerId);
  }

  async save(character: Character): Promise<Character> {
    const characters = await this.findAll();
    characters.push(character);
    await this.store.write(this.fileName, characters);
    return character;
  }

  async update(character: Character): Promise<Character> {
    const characters = await this.findAll();
    const index = characters.findIndex((item) => item.id === character.id);
    if (index === -1) {
      throw new Error('Personagem não encontrado');
    }
    characters[index] = character;
    await this.store.write(this.fileName, characters);
    return character;
  }

  async delete(id: string): Promise<void> {
    const characters = await this.findAll();
    const next = characters.filter((character) => character.id !== id);
    if (next.length === characters.length) {
      throw new Error('Personagem não encontrado');
    }
    await this.store.write(this.fileName, next);
  }
}
