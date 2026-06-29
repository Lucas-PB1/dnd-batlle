'use client';

import {
  rankAccentClass,
  RankLabel,
  RankTierBadge,
} from '@/components/ranking/ranking-visuals';
import { ARENA_COPY } from '@/shared/constants/arena-copy';

export interface LeaderboardRowData {
  key: string;
  rank: number;
  tied: boolean;
  title: string;
  subtitle?: string;
  meta?: string;
  points: number;
  record: string;
  duels: number;
}

function GloryMeter({ points, maxPoints }: { points: number; maxPoints: number }) {
  const width = maxPoints > 0 ? Math.max((points / maxPoints) * 100, points > 0 ? 6 : 0) : 0;

  return (
    <div className="hidden min-w-[5rem] flex-col gap-1 sm:flex">
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function RankingLeaderboard({
  rows,
  maxPoints,
  emptyLabel = 'Ninguém além do pódio ainda.',
}: {
  rows: LeaderboardRowData[];
  maxPoints: number;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-muted border-t border-white/5 py-8 text-center text-sm">{emptyLabel}</p>
    );
  }

  return (
    <div className="mt-2 divide-y divide-white/[0.06]">
      {rows.map((row) => (
        <article
          key={row.key}
          className={`group flex items-center gap-3 border-l-2 py-4 pl-3 pr-1 transition hover:bg-white/[0.02] sm:gap-4 sm:py-5 sm:pl-4 ${rankAccentClass(row.rank)}`}
        >
          <div className="w-16 shrink-0 sm:w-20">
            <RankLabel rank={row.rank} tied={row.tied} size="md" />
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900/80 text-sm font-bold ring-1 ring-white/10 sm:h-11 sm:w-11">
            {row.title.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{row.title}</h3>
              <RankTierBadge rank={row.rank} />
            </div>
            {row.subtitle && (
              <p className="text-muted truncate text-xs">{row.subtitle}</p>
            )}
            {row.meta && <p className="text-muted truncate text-[11px]">{row.meta}</p>}
            <p className="text-muted mt-1 text-[11px] sm:hidden">
              {row.record}
              {row.duels === 0 ? ' · sem duelos' : ''}
            </p>
          </div>

          <GloryMeter points={row.points} maxPoints={maxPoints} />

          <div className="shrink-0 text-right">
            <p className="text-accent text-xl font-black tabular-nums sm:text-2xl">{row.points}</p>
            <p className="text-muted text-[10px] tracking-widest uppercase">{ARENA_COPY.gloryShort}</p>
            <p className="text-muted mt-1 hidden text-[11px] sm:block">
              {row.record}
              {row.duels === 0 ? ' · —' : ''}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RankingLeaderboardMobile({
  rows,
  maxPoints,
}: {
  rows: LeaderboardRowData[];
  maxPoints: number;
}) {
  return <RankingLeaderboard rows={rows} maxPoints={maxPoints} />;
}
