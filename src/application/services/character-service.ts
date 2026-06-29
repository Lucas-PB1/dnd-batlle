import { randomUUID } from 'crypto';
import type { ICharacterRepository } from '@/domain/repositories';
import type { Character, UserRole } from '@/domain/entities';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';

const MAX_PORTRAIT_LENGTH = 200_000;

export interface CreateCharacterInput {
  playerId: string;
  name: string;
  characterClass: string;
  subclass?: string;
  description?: string;
  portraitUrl?: string;
  generation?: string;
  isDead?: boolean;
}

export interface UpdateCharacterInput {
  name?: string;
  characterClass?: string;
  subclass?: string;
  description?: string;
  portraitUrl?: string | null;
  generation?: string;
  isDead?: boolean;
  active?: boolean;
}

export interface CharacterActor {
  userId: string;
  roles: UserRole[];
}

export class CharacterService {
  constructor(private readonly characterRepository: ICharacterRepository) {}

  async listByPlayer(playerId: string): Promise<Character[]> {
    const characters = await this.characterRepository.findByPlayerId(playerId);
    return characters.filter((character) => character.active);
  }

  async listAll(includeInactive = false): Promise<Character[]> {
    const characters = await this.characterRepository.findAll();
    if (includeInactive) return characters;
    return characters.filter((character) => character.active);
  }

  async create(input: CreateCharacterInput): Promise<Character> {
    if (!BRACKET_BY_CLASS[input.characterClass]) {
      throw new Error('Classe inválida');
    }

    const portraitUrl = sanitizePortrait(input.portraitUrl);
    const character: Character = {
      id: randomUUID(),
      playerId: input.playerId,
      name: input.name.trim(),
      characterClass: input.characterClass,
      subclass: input.subclass?.trim(),
      description: input.description?.trim(),
      portraitUrl,
      generation: input.generation?.trim(),
      isDead: input.isDead ?? false,
      active: true,
      createdAt: new Date().toISOString(),
    };

    return this.characterRepository.save(character);
  }

  async update(
    characterId: string,
    actor: CharacterActor,
    input: UpdateCharacterInput,
  ): Promise<Character> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw new Error('Personagem não encontrado');
    }

    const isAdmin = actor.roles.includes('admin');
    const isOwner = character.playerId === actor.userId;
    if (!isAdmin && !isOwner) {
      throw new Error('Sem permissão');
    }

    return this.applyUpdate(character, input);
  }

  async delete(characterId: string, actor: CharacterActor): Promise<void> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw new Error('Personagem não encontrado');
    }

    const isAdmin = actor.roles.includes('admin');
    const isOwner = character.playerId === actor.userId;
    if (!isAdmin && !isOwner) {
      throw new Error('Sem permissão');
    }

    if (!character.active) {
      throw new Error('Personagem já removido');
    }

    await this.characterRepository.update({ ...character, active: false });
  }

  private async applyUpdate(
    character: Character,
    input: UpdateCharacterInput,
  ): Promise<Character> {
    if (input.characterClass && !BRACKET_BY_CLASS[input.characterClass]) {
      throw new Error('Classe inválida');
    }

    const updated: Character = {
      ...character,
      name: input.name?.trim() ?? character.name,
      characterClass: input.characterClass ?? character.characterClass,
      subclass: input.subclass?.trim() ?? character.subclass,
      description: input.description?.trim() ?? character.description,
      portraitUrl:
        input.portraitUrl === null
          ? undefined
          : sanitizePortrait(input.portraitUrl) ?? character.portraitUrl,
      generation: input.generation?.trim() ?? character.generation,
      isDead: input.isDead ?? character.isDead,
      active: input.active ?? character.active,
    };

    return this.characterRepository.update(updated);
  }
}

function sanitizePortrait(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_PORTRAIT_LENGTH) {
    throw new Error('Imagem muito grande (máx. ~200KB em base64)');
  }
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http')) {
    return trimmed;
  }
  throw new Error('URL de imagem inválida');
}
