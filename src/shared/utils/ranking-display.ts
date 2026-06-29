export interface RankingStats {
  points: number;
  wins: number;
  draws: number;
  losses: number;
  duels: number;
}

export interface RankedEntry<T> {
  entry: T;
  rank: number;
  tied: boolean;
}

export function areRankingStatsEqual(a: RankingStats, b: RankingStats): boolean {
  return (
    a.points === b.points &&
    a.wins === b.wins &&
    a.draws === b.draws &&
    a.losses === b.losses &&
    a.duels === b.duels
  );
}

export function buildDisplayRanks<T extends RankingStats>(entries: T[]): RankedEntry<T>[] {
  let rank = 1;

  return entries.map((entry, index) => {
    if (index > 0 && !areRankingStatsEqual(entries[index - 1], entry)) {
      rank = index + 1;
    }

    const tiedBefore = index > 0 && areRankingStatsEqual(entries[index - 1], entry);
    const tiedAfter =
      index < entries.length - 1 && areRankingStatsEqual(entry, entries[index + 1]);

    return {
      entry,
      rank,
      tied: tiedBefore || tiedAfter,
    };
  });
}

export function groupByRank<T>(ranked: RankedEntry<T>[]): Map<number, RankedEntry<T>[]> {
  const map = new Map<number, RankedEntry<T>[]>();

  for (const item of ranked) {
    const group = map.get(item.rank) ?? [];
    group.push(item);
    map.set(item.rank, group);
  }

  return map;
}
