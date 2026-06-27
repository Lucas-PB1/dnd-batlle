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
      role TEXT NOT NULL CHECK (role IN ('admin', 'judge')),
      display_name TEXT NOT NULL,
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
