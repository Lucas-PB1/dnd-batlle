import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;
let schemaReady: Promise<void> | null = null;

export function isPostgresEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada');
  }

  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }

  return sql;
}

async function ensureSchema(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT,
      display_name TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roles JSONB`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_email TEXT`;
  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;
  await sql`
    UPDATE users
    SET roles = to_jsonb(ARRAY[role])
    WHERE roles IS NULL AND role IS NOT NULL
  `;
  await sql`
    UPDATE users
    SET email = username || '@arena.local'
    WHERE email IS NULL
  `;
  await sql`
    UPDATE users
    SET roles = '["player"]'::jsonb
    WHERE roles IS NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES users (id),
      name TEXT NOT NULL,
      character_class TEXT NOT NULL,
      subclass TEXT,
      description TEXT,
      portrait_url TEXT,
      generation TEXT,
      is_dead BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS duels (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      judge_id TEXT NOT NULL REFERENCES users (id),
      judge_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('open', 'ready', 'completed')),
      is_classified BOOLEAN NOT NULL DEFAULT FALSE,
      arena INTEGER,
      player_a JSONB,
      player_b JSONB,
      result JSONB,
      created_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ
    )
  `;
}

export function ensureSchemaOnce(): Promise<void> {
  if (!schemaReady) {
    schemaReady = ensureSchema();
  }

  return schemaReady;
}

export function resetDbClientForTests(): void {
  sql = null;
  schemaReady = null;
}
