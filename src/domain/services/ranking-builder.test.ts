import { describe, expect, it } from 'vitest';
import type { Character, CharacterRankingEntry, User } from '@/domain/entities';
import {
  buildPlayerRankingsFromCharacters,
  mergeCharacterRankings,
} from '@/domain/services/ranking-builder';

const player: User = {
  id: 'p1',
  email: 'hero@test.local',
  username: 'hero',
  passwordHash: 'x',
  roles: ['player'],
  displayName: 'Aldric',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const character: Character = {
  id: 'c1',
  playerId: 'p1',
  name: 'Thorin',
  characterClass: 'Lutador',
  isDead: false,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ranking-builder', () => {
  it('includes registered characters with zero glory before any duel', () => {
    const ranking = mergeCharacterRankings(
      [],
      [{ ...character, description: 'A arena me chama.' }],
      [player],
    );

    expect(ranking).toHaveLength(1);
    expect(ranking[0].points).toBe(0);
    expect(ranking[0].characterName).toBe('Thorin');
    expect(ranking[0].description).toBe('A arena me chama.');
  });

  it('sums player glory automatically from character results', () => {
    const duelEntry: CharacterRankingEntry = {
      characterId: 'c1',
      characterName: 'Thorin',
      playerId: 'p1',
      playerDisplayName: 'Aldric',
      characterClass: 'Lutador',
      bracket: 'A',
      points: 4,
      wins: 1,
      draws: 0,
      losses: 0,
      duels: 1,
    };

    const characters = mergeCharacterRankings([duelEntry], [character], [player]);
    const players = buildPlayerRankingsFromCharacters(characters, [player], [character]);

    expect(players[0].points).toBe(4);
    expect(players[0].wins).toBe(1);
  });

  it('lists adventurers with zero glory when they have no duels', () => {
    const characters = mergeCharacterRankings([], [character], [player]);
    const players = buildPlayerRankingsFromCharacters(characters, [player], [character]);

    expect(players[0].points).toBe(0);
    expect(players[0].playerDisplayName).toBe('Aldric');
    expect(players[0].characters).toBe(1);
  });
});
