import type { Character } from '@/domain/entities';
import type { ICharacterRepository } from '@/domain/repositories';
import { ensureSchemaOnce, getSql } from '@/infrastructure/persistence/db';
import { mapCharacterRow, type CharacterRow } from '@/infrastructure/persistence/mappers';

export class CharacterPostgresRepository implements ICharacterRepository {
  private async ready() {
    await ensureSchemaOnce();
    return getSql();
  }

  async findAll(): Promise<Character[]> {
    const sql = await this.ready();
    const rows =
      (await sql`SELECT * FROM characters ORDER BY created_at ASC`) as CharacterRow[];
    return rows.map(mapCharacterRow);
  }

  async findById(id: string): Promise<Character | null> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM characters WHERE id = ${id} LIMIT 1`) as CharacterRow[];
    const row = rows[0];
    return row ? mapCharacterRow(row) : null;
  }

  async findByPlayerId(playerId: string): Promise<Character[]> {
    const sql = await this.ready();
    const rows = (await sql`
      SELECT * FROM characters
      WHERE player_id = ${playerId}
      ORDER BY created_at ASC
    `) as CharacterRow[];
    return rows.map(mapCharacterRow);
  }

  async save(character: Character): Promise<Character> {
    const sql = await this.ready();
    await sql`
      INSERT INTO characters (
        id,
        player_id,
        name,
        character_class,
        subclass,
        description,
        portrait_url,
        generation,
        is_dead,
        active,
        created_at
      ) VALUES (
        ${character.id},
        ${character.playerId},
        ${character.name},
        ${character.characterClass},
        ${character.subclass ?? null},
        ${character.description ?? null},
        ${character.portraitUrl ?? null},
        ${character.generation ?? null},
        ${character.isDead},
        ${character.active},
        ${character.createdAt}
      )
    `;
    return character;
  }

  async update(character: Character): Promise<Character> {
    const sql = await this.ready();
    const rows = (await sql`
      UPDATE characters
      SET
        name = ${character.name},
        character_class = ${character.characterClass},
        subclass = ${character.subclass ?? null},
        description = ${character.description ?? null},
        portrait_url = ${character.portraitUrl ?? null},
        generation = ${character.generation ?? null},
        is_dead = ${character.isDead},
        active = ${character.active}
      WHERE id = ${character.id}
      RETURNING *
    `) as CharacterRow[];

    const row = rows[0];
    if (!row) {
      throw new Error('Personagem não encontrado');
    }

    return mapCharacterRow(row);
  }
}
