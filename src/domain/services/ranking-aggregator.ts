import type {
  CharacterRankingEntry,
  CompletedDuelSummary,
  Duel,
  PlayerRankingEntry,
} from '@/domain/entities';

function characterKey(characterId: string | undefined, name: string, characterClass: string): string {
  if (characterId) return `char:${characterId}`;
  return `legacy:${name.toLowerCase()}::${characterClass}`;
}

function playerKey(playerId: string | undefined, displayName: string | undefined): string | null {
  if (playerId) return `player:${playerId}`;
  if (displayName) return `name:${displayName.toLowerCase()}`;
  return null;
}

export interface RankingAggregation {
  characterRanking: CharacterRankingEntry[];
  playerRanking: PlayerRankingEntry[];
  recentDuels: CompletedDuelSummary[];
}

export function aggregateRankings(
  duels: Duel[],
  options?: { playerId?: string; onlyClassified?: boolean },
): RankingAggregation {
  let completed = duels.filter((duel) => duel.status === 'completed' && duel.result);
  if (options?.onlyClassified !== false) {
    completed = completed.filter((duel) => duel.isClassified);
  }

  const characterMap = new Map<string, CharacterRankingEntry>();
  const playerMap = new Map<string, PlayerRankingEntry>();

  for (const duel of completed) {
    if (!duel.playerA || !duel.playerB || !duel.result) continue;

    applyCharacterResult(characterMap, duel.playerA, duel.result.pointsA, duel.result.outcome, 'A');
    applyCharacterResult(characterMap, duel.playerB, duel.result.pointsB, duel.result.outcome, 'B');

    applyPlayerResult(
      playerMap,
      duel.playerA.playerId,
      duel.playerA.playerDisplayName,
      duel.result.pointsA,
      duel.result.outcome,
      'A',
    );
    applyPlayerResult(
      playerMap,
      duel.playerB.playerId,
      duel.playerB.playerDisplayName,
      duel.result.pointsB,
      duel.result.outcome,
      'B',
    );
  }

  let characterRanking = [...characterMap.values()].sort(
    (a, b) => b.points - a.points || b.wins - a.wins,
  );
  let playerRanking = [...playerMap.values()].sort(
    (a, b) => b.points - a.points || b.wins - a.wins,
  );

  if (options?.playerId) {
    characterRanking = characterRanking.filter((entry) => entry.playerId === options.playerId);
    playerRanking = playerRanking.filter((entry) => entry.playerId === options.playerId);
  }

  const recentDuels: CompletedDuelSummary[] = completed
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 20)
    .map((duel) => ({
      id: duel.id,
      playerAName: duel.playerA!.name,
      playerBName: duel.playerB!.name,
      playerAClass: duel.playerA!.characterClass,
      playerBClass: duel.playerB!.characterClass,
      playerADisplayName: duel.playerA!.playerDisplayName,
      playerBDisplayName: duel.playerB!.playerDisplayName,
      outcome: duel.result!.outcome,
      arena: duel.arena,
      rounds: duel.result!.rounds,
      completedAt: duel.completedAt!,
      isClassified: duel.isClassified,
    }));

  return { characterRanking, playerRanking, recentDuels };
}

function applyCharacterResult(
  map: Map<string, CharacterRankingEntry>,
  entry: NonNullable<Duel['playerA']>,
  points: number,
  outcome: NonNullable<Duel['result']>['outcome'],
  slot: 'A' | 'B',
): void {
  const key = characterKey(entry.characterId, entry.name, entry.characterClass);
  const current = map.get(key) ?? {
    characterId: entry.characterId,
    characterName: entry.name,
    playerId: entry.playerId,
    playerDisplayName: entry.playerDisplayName,
    characterClass: entry.characterClass,
    subclass: entry.subclass,
    description: entry.description,
    bracket: entry.bracket,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    duels: 0,
  };

  if (!current.description && entry.description) {
    current.description = entry.description;
  }

  current.points += points;
  current.duels += 1;
  applyOutcome(current, outcome, slot);
  map.set(key, current);
}

function applyPlayerResult(
  map: Map<string, PlayerRankingEntry>,
  playerId: string | undefined,
  displayName: string | undefined,
  points: number,
  outcome: NonNullable<Duel['result']>['outcome'],
  slot: 'A' | 'B',
): void {
  const key = playerKey(playerId, displayName);
  if (!key || !playerId) return;

  const current = map.get(key) ?? {
    playerId,
    playerDisplayName: displayName ?? 'Jogador',
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    duels: 0,
    characters: 0,
  };

  current.points += points;
  current.duels += 1;
  applyOutcome(current, outcome, slot);
  map.set(key, current);
}

function applyOutcome(
  current: { wins: number; draws: number; losses: number },
  outcome: NonNullable<Duel['result']>['outcome'],
  slot: 'A' | 'B',
): void {
  if (outcome === 'draw') {
    current.draws += 1;
    return;
  }
  if (
    (outcome === 'player_a' && slot === 'A') ||
    (outcome === 'player_b' && slot === 'B')
  ) {
    current.wins += 1;
    return;
  }
  current.losses += 1;
}
