/**
 * Reparo: duelo paladino vs Tinkaton — classe Caçador de Monstros (faixa A).
 * Paladino (B) vence favorecido sobre A → +2 GLR.
 * Uso: DATABASE_URL=... node scripts/repair-paladino-tinkaton-duel.mjs
 */
import { neon } from '@neondatabase/serverless';

const DUEL_ID = '99eda7a1-22ad-403e-b2fc-4553e63122cb';
const TINKATON_CHARACTER_ID = '016b9396-6726-49f7-a708-49dfb54993ae';
const TINKATON_PLAYER_ID = 'a5b41523-4a56-4194-9043-e3d5722bd714';

const sql = neon(process.env.DATABASE_URL);

const playerB = {
  characterId: TINKATON_CHARACTER_ID,
  playerId: TINKATON_PLAYER_ID,
  playerDisplayName: 'Tinkaton',
  name: 'Tinkaton',
  characterClass: 'Caçador de Monstros',
  subclass: '',
  description: '"TINK"',
  generation: '',
  isDead: false,
  bracket: 'A',
  seasonPointsBefore: 0,
};

const result = {
  outcome: 'player_a',
  rounds: 5,
  pointsA: 2,
  pointsB: 0,
  notes: 'Paladino (B) venceu Tinkaton — Caçador de Monstros (A). Cross-faixa favorecido +2.',
};

await sql`
  UPDATE characters
  SET character_class = 'Caçador de Monstros'
  WHERE id = ${TINKATON_CHARACTER_ID}
`;

const rows = await sql`
  UPDATE duels
  SET
    player_b = ${JSON.stringify(playerB)}::jsonb,
    result = ${JSON.stringify(result)}::jsonb
  WHERE id = ${DUEL_ID}
  RETURNING id, player_a, player_b, result
`;

console.log('Reparo aplicado:', JSON.stringify(rows[0], null, 2));
