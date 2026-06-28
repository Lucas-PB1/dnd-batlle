import type { User } from '@/domain/entities';
import type { IUserRepository } from '@/domain/repositories';
import { ensureSchemaOnce, getSql } from '@/infrastructure/persistence/db';
import { mapUserRow, type UserRow } from '@/infrastructure/persistence/mappers';

export class UserPostgresRepository implements IUserRepository {
  private async ready() {
    await ensureSchemaOnce();
    return getSql();
  }

  async findAll(): Promise<User[]> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM users ORDER BY created_at ASC`) as UserRow[];
    return rows.map(mapUserRow);
  }

  async findById(id: string): Promise<User | null> {
    const sql = await this.ready();
    const rows = (await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`) as UserRow[];
    const row = rows[0];
    return row ? mapUserRow(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const sql = await this.ready();
    const rows =
      (await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`) as UserRow[];
    const row = rows[0];
    return row ? mapUserRow(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = await this.ready();
    const normalized = email.trim().toLowerCase();
    const rows =
      (await sql`SELECT * FROM users WHERE LOWER(email) = ${normalized} LIMIT 1`) as UserRow[];
    const row = rows[0];
    return row ? mapUserRow(row) : null;
  }

  async save(user: User): Promise<User> {
    const sql = await this.ready();
    await sql`
      INSERT INTO users (
        id,
        email,
        username,
        password_hash,
        roles,
        role,
        display_name,
        active,
        created_at
      ) VALUES (
        ${user.id},
        ${user.email},
        ${user.username},
        ${user.passwordHash},
        ${JSON.stringify(user.roles)},
        ${user.roles[0] ?? 'player'},
        ${user.displayName},
        ${user.active},
        ${user.createdAt}
      )
    `;
    return user;
  }

  async update(user: User): Promise<User> {
    const sql = await this.ready();
    const rows = (await sql`
      UPDATE users
      SET
        email = ${user.email},
        username = ${user.username},
        password_hash = ${user.passwordHash},
        roles = ${JSON.stringify(user.roles)},
        role = ${user.roles[0] ?? 'player'},
        display_name = ${user.displayName},
        active = ${user.active},
        created_at = ${user.createdAt}
      WHERE id = ${user.id}
      RETURNING *
    `) as UserRow[];

    const row = rows[0];
    if (!row) {
      throw new Error('Usuário não encontrado');
    }

    return mapUserRow(row);
  }
}
