'use client';

import { RankingHall } from '@/components/ranking/ranking-hall';
import type { LeaderboardRowData } from '@/components/ranking/ranking-leaderboard';
import type { CharacterRankingEntry, PlayerRankingEntry } from '@/domain/entities';
import { ARENA_COPY, TOP_RANK_LIMIT } from '@/shared/constants/arena-copy';
import { buildDisplayRanks } from '@/shared/utils/ranking-display';

function toCharacterRows(
  ranked: ReturnType<typeof buildDisplayRanks<CharacterRankingEntry>>,
): LeaderboardRowData[] {
  return ranked.map(({ entry, rank, tied }) => ({
    key: `${entry.characterId ?? entry.characterName}-${rank}-${entry.points}`,
    rank,
    tied,
    title: entry.characterName,
    subtitle: entry.playerDisplayName,
    meta: `${entry.characterClass} · ${ARENA_COPY.bracket} ${entry.bracket}`,
    points: entry.points,
    record: `${entry.wins}V/${entry.draws}E/${entry.losses}D`,
    duels: entry.duels,
  }));
}

function toPlayerRows(
  ranked: ReturnType<typeof buildDisplayRanks<PlayerRankingEntry>>,
): LeaderboardRowData[] {
  return ranked.map(({ entry, rank, tied }) => ({
    key: `${entry.playerId}-${rank}`,
    rank,
    tied,
    title: entry.playerDisplayName,
    meta: `${entry.characters} herói(s)`,
    points: entry.points,
    record: `${entry.wins}V/${entry.draws}E/${entry.losses}D`,
    duels: entry.duels,
  }));
}

export function CharacterRankingBoard({ ranking }: { ranking: CharacterRankingEntry[] }) {
  const top = ranking.slice(0, TOP_RANK_LIMIT);
  const ranked = buildDisplayRanks(top);
  const maxPoints = top[0]?.points ?? 1;

  return <RankingHall rows={toCharacterRows(ranked)} maxPoints={maxPoints} />;
}

export function PlayerRankingBoard({ ranking }: { ranking: PlayerRankingEntry[] }) {
  const top = ranking.slice(0, TOP_RANK_LIMIT);
  const ranked = buildDisplayRanks(top);
  const maxPoints = top[0]?.points ?? 1;

  return <RankingHall rows={toPlayerRows(ranked)} maxPoints={maxPoints} />;
}

export function RankingPodiumHint() {
  return null;
}
