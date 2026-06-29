import type {
  Character,
  CharacterRankingEntry,
  PlayerRankingEntry,
  User,
} from '@/domain/entities';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';
import { hasRole } from '@/shared/utils/roles';

function sortCharacters(a: CharacterRankingEntry, b: CharacterRankingEntry): number {
  return (
    b.points - a.points ||
    b.wins - a.wins ||
    a.characterName.localeCompare(b.characterName, 'pt-BR')
  );
}

function sortPlayers(a: PlayerRankingEntry, b: PlayerRankingEntry): number {
  return (
    b.points - a.points ||
    b.wins - a.wins ||
    a.playerDisplayName.localeCompare(b.playerDisplayName, 'pt-BR')
  );
}

export function mergeCharacterRankings(
  fromDuels: CharacterRankingEntry[],
  characters: Character[],
  users: User[],
): CharacterRankingEntry[] {
  const userMap = new Map(users.map((user) => [user.id, user.displayName]));
  const map = new Map<string, CharacterRankingEntry>();

  for (const entry of fromDuels) {
    const key = entry.characterId ?? `legacy:${entry.characterName.toLowerCase()}::${entry.characterClass}`;
    map.set(key, entry);
  }

  const characterById = new Map(characters.map((item) => [item.id, item]));

  for (const entry of map.values()) {
    if (!entry.characterId) continue;
    const source = characterById.get(entry.characterId);
    if (source?.description && !entry.description) {
      entry.description = source.description;
    }
  }

  for (const character of characters) {
    if (!character.active) continue;

    const key = character.id;
    const existing = map.get(key);
    if (existing) {
      if (character.description && !existing.description) {
        existing.description = character.description;
      }
      continue;
    }

    const bracket = BRACKET_BY_CLASS[character.characterClass] ?? 'A';
    map.set(key, {
      characterId: character.id,
      characterName: character.name,
      playerId: character.playerId,
      playerDisplayName: userMap.get(character.playerId),
      characterClass: character.characterClass,
      subclass: character.subclass,
      description: character.description,
      bracket,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      duels: 0,
    });
  }

  return [...map.values()].sort(sortCharacters);
}

export function buildPlayerRankingsFromCharacters(
  characterRanking: CharacterRankingEntry[],
  players: User[],
  characters: Character[],
): PlayerRankingEntry[] {
  const characterCountByPlayer = new Map<string, number>();
  for (const character of characters) {
    if (!character.active) continue;
    characterCountByPlayer.set(
      character.playerId,
      (characterCountByPlayer.get(character.playerId) ?? 0) + 1,
    );
  }

  const map = new Map<string, PlayerRankingEntry>();

  for (const entry of characterRanking) {
    if (!entry.playerId) continue;

    const current = map.get(entry.playerId) ?? {
      playerId: entry.playerId,
      playerDisplayName: entry.playerDisplayName ?? 'Aventureiro',
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      duels: 0,
      characters: characterCountByPlayer.get(entry.playerId) ?? 0,
    };

    current.points += entry.points;
    current.wins += entry.wins;
    current.draws += entry.draws;
    current.losses += entry.losses;
    current.duels += entry.duels;
    current.playerDisplayName =
      entry.playerDisplayName ?? current.playerDisplayName;
    current.characters = characterCountByPlayer.get(entry.playerId) ?? current.characters;

    map.set(entry.playerId, current);
  }

  for (const player of players) {
    if (!player.active || !hasRole(player, 'player')) continue;

    if (!map.has(player.id)) {
      map.set(player.id, {
        playerId: player.id,
        playerDisplayName: player.displayName,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        duels: 0,
        characters: characterCountByPlayer.get(player.id) ?? 0,
      });
    } else {
      const current = map.get(player.id)!;
      current.playerDisplayName = player.displayName;
      current.characters = characterCountByPlayer.get(player.id) ?? current.characters;
    }
  }

  return [...map.values()].sort(sortPlayers);
}

export function filterRankingsForPlayer<T extends { playerId?: string }>(
  entries: T[],
  playerId: string,
): T[] {
  return entries.filter((entry) => entry.playerId === playerId);
}
