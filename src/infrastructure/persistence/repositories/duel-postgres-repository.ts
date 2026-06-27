import type { Duel } from '@/domain/entities';
import type { IDuelRepository } from '@/domain/repositories';
import { ensureSchemaOnce, getSql } from '@/infrastructure/persistence/db';
import { mapDuelRow, type DuelRow } from '@/infrastructure/persistence/mappers';

export class DuelPostgresRepository implements IDuelRepository {
  private async ready() {
    await ensureSchemaOnce();
    return getSql();
  }

  async findAll(): Promise<Duel[]> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM duels ORDER BY created_at ASC`) as DuelRow[];
    return rows.map(mapDuelRow);
  }

  async findById(id: string): Promise<Duel | null> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM duels WHERE id = ${id} LIMIT 1`) as DuelRow[];
    const row = rows[0];
    return row ? mapDuelRow(row) : null;
  }

  async findByToken(token: string): Promise<Duel | null> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM duels WHERE token = ${token} LIMIT 1`) as DuelRow[];
    const row = rows[0];
    return row ? mapDuelRow(row) : null;
  }

  async save(duel: Duel): Promise<Duel> {
    const sql = await this.ready();
    await sql`
      INSERT INTO duels (
        id,
        token,
        judge_id,
        judge_name,
        status,
        is_classified,
        arena,
        player_a,
        player_b,
        result,
        created_at,
        completed_at
      ) VALUES (
        ${duel.id},
        ${duel.token},
        ${duel.judgeId},
        ${duel.judgeName},
        ${duel.status},
        ${duel.isClassified},
        ${duel.arena ?? null},
        ${duel.playerA ?? null},
        ${duel.playerB ?? null},
        ${duel.result ?? null},
        ${duel.createdAt},
        ${duel.completedAt ?? null}
      )
    `;
    return duel;
  }

  async update(duel: Duel): Promise<Duel> {
    const sql = await this.ready();
    const rows = (await sql`
      UPDATE duels
      SET
        token = ${duel.token},
        judge_id = ${duel.judgeId},
        judge_name = ${duel.judgeName},
        status = ${duel.status},
        is_classified = ${duel.isClassified},
        arena = ${duel.arena ?? null},
        player_a = ${duel.playerA ?? null},
        player_b = ${duel.playerB ?? null},
        result = ${duel.result ?? null},
        created_at = ${duel.createdAt},
        completed_at = ${duel.completedAt ?? null}
      WHERE id = ${duel.id}
      RETURNING *
    `) as DuelRow[];

    const row = rows[0];
    if (!row) {
      throw new Error('Duelo não encontrado');
    }

    return mapDuelRow(row);
  }
}
