import type { Arena } from '@/domain/entities';
import type { IArenaRepository } from '@/domain/repositories';
import { ensureSchemaOnce, getSql } from '@/infrastructure/persistence/db';
import { mapArenaRow, type ArenaRow } from '@/infrastructure/persistence/arena-mappers';

export class ArenaPostgresRepository implements IArenaRepository {
  private async ready() {
    await ensureSchemaOnce();
    return getSql();
  }

  async findAll(): Promise<Arena[]> {
    const sql = await this.ready();
    const rows = (await sql`
      SELECT * FROM arenas ORDER BY sort_order ASC, dice_value ASC
    `) as ArenaRow[];
    return rows.map(mapArenaRow);
  }

  async findById(id: string): Promise<Arena | null> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM arenas WHERE id = ${id} LIMIT 1`) as ArenaRow[];
    const row = rows[0];
    return row ? mapArenaRow(row) : null;
  }

  async findByDiceValue(diceValue: number): Promise<Arena | null> {
    const sql = await this.ready();
    const rows =
      (await sql`SELECT * FROM arenas WHERE dice_value = ${diceValue} LIMIT 1`) as ArenaRow[];
    const row = rows[0];
    return row ? mapArenaRow(row) : null;
  }

  async save(arena: Arena): Promise<Arena> {
    const sql = await this.ready();
    await sql`
      INSERT INTO arenas (
        id, dice_value, name, effect, description, sort_order, active, created_at
      ) VALUES (
        ${arena.id},
        ${arena.diceValue},
        ${arena.name},
        ${arena.effect},
        ${arena.description ?? null},
        ${arena.sortOrder},
        ${arena.active},
        ${arena.createdAt}
      )
    `;
    return arena;
  }

  async update(arena: Arena): Promise<Arena> {
    const sql = await this.ready();
    const rows = (await sql`
      UPDATE arenas
      SET
        dice_value = ${arena.diceValue},
        name = ${arena.name},
        effect = ${arena.effect},
        description = ${arena.description ?? null},
        sort_order = ${arena.sortOrder},
        active = ${arena.active}
      WHERE id = ${arena.id}
      RETURNING *
    `) as ArenaRow[];

    const row = rows[0];
    if (!row) throw new Error('Arena não encontrada');
    return mapArenaRow(row);
  }
}
