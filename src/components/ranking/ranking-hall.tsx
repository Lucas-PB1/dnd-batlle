'use client';

import { cn } from '@/lib/cn';
import {
  getRankColors,
  RankLabel,
  RankMedalIcon,
  RankTierBadge,
} from '@/components/ranking/ranking-visuals';
import { ARENA_COPY } from '@/shared/constants/arena-copy';
import type { LeaderboardRowData } from '@/components/ranking/ranking-leaderboard';

export type HallEntry = LeaderboardRowData;

function MetaTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-stone-300',
        className,
      )}
    >
      {children}
    </span>
  );
}

function GloryBlock({
  points,
  rank,
  large = false,
}: {
  points: number;
  rank: number;
  large?: boolean;
}) {
  const colors = getRankColors(rank);

  return (
    <div className="shrink-0 text-right">
      <p
        className={cn(
          'font-black tabular-nums leading-none',
          large ? 'text-2xl' : 'text-lg',
          colors?.text ?? 'text-amber-500/90',
        )}
      >
        {points}
      </p>
      <p className="text-muted mt-0.5 text-[10px] tracking-wide uppercase">{ARENA_COPY.gloryShort}</p>
    </div>
  );
}

function AvatarBadge({ title, rank }: { title: string; rank: number }) {
  const colors = getRankColors(rank);

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-stone-900 font-bold ring-1',
        rank === 1 ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm',
        colors?.ring ?? 'ring-white/10',
      )}
    >
      {title.slice(0, 1).toUpperCase()}
    </span>
  );
}

function GloryBar({ points, maxPoints }: { points: number; maxPoints: number }) {
  const barPct =
    maxPoints > 0 ? Math.max((points / maxPoints) * 100, points > 0 ? 8 : 0) : 0;

  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-800/80">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-950 via-amber-600 to-amber-400"
        style={{ width: `${barPct}%` }}
      />
    </div>
  );
}

function ChampionCard({ entry, maxPoints }: { entry: HallEntry; maxPoints: number }) {
  const colors = getRankColors(1);

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border px-4 py-4 sm:px-5 sm:py-5',
        'border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-stone-950/40 to-stone-950/60',
        colors?.glow,
      )}
    >
      <div
        className="pointer-events-none absolute -top-8 right-4 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-3 sm:gap-4">
        <AvatarBadge title={entry.title} rank={1} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{entry.title}</h3>
            <RankTierBadge rank={1} />
            {entry.tied && (
              <MetaTag className="border-amber-500/20 text-amber-200/80">{ARENA_COPY.tiedRank}</MetaTag>
            )}
          </div>
          {entry.subtitle && (
            <p className="text-muted mt-0.5 text-sm">{entry.subtitle}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.meta && <MetaTag>{entry.meta}</MetaTag>}
            <MetaTag>{entry.record}</MetaTag>
            {entry.duels != null && (
              <MetaTag>
                {entry.duels} {entry.duels === 1 ? 'duelo' : 'duelos'}
              </MetaTag>
            )}
          </div>
          <GloryBar points={entry.points} maxPoints={maxPoints} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <RankMedalIcon rank={1} className="h-6 w-6 text-amber-300/80" />
          <GloryBlock points={entry.points} rank={1} large />
        </div>
      </div>
    </article>
  );
}

function RankingRow({ entry, maxPoints }: { entry: HallEntry; maxPoints: number }) {
  const colors = getRankColors(entry.rank);
  const isPodium = entry.rank <= 3;

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-xl border border-white/[0.06] bg-stone-950/30 px-3 py-3 transition-colors hover:border-white/10 hover:bg-stone-950/50 sm:px-4',
        entry.rank === 2 && 'border-l-2 border-l-stone-300/40',
        entry.rank === 3 && 'border-l-2 border-l-orange-700/50',
      )}
    >
      <div className="w-10 shrink-0">
        <RankLabel rank={entry.rank} tied={entry.tied} size="sm" />
      </div>

      <AvatarBadge title={entry.title} rank={entry.rank} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-medium">{entry.title}</p>
          {isPodium && <RankTierBadge rank={entry.rank} />}
        </div>
        {entry.subtitle && (
          <p className="text-muted truncate text-xs">{entry.subtitle}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {entry.meta && <MetaTag>{entry.meta}</MetaTag>}
          <MetaTag className={colors?.badge}>{entry.record}</MetaTag>
        </div>
        <GloryBar points={entry.points} maxPoints={maxPoints} />
      </div>

      <GloryBlock points={entry.points} rank={entry.rank} />
    </li>
  );
}

export function RankingHall({
  rows,
  maxPoints,
}: {
  rows: HallEntry[];
  maxPoints: number;
}) {
  if (rows.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">{ARENA_COPY.noDuelsYet}</p>;
  }

  const champions = rows.filter((row) => row.rank === 1);
  const rest = rows.filter((row) => row.rank !== 1);

  return (
    <div className="space-y-5">
      {champions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-amber-400/90" aria-hidden>
              ♛
            </span>
            <p className="text-muted text-[11px] tracking-[0.15em] uppercase">
              {ARENA_COPY.champion}
            </p>
          </div>
          <div className="space-y-3">
            {champions.map((entry) => (
              <ChampionCard key={entry.key} entry={entry} maxPoints={maxPoints} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-2">
          {champions.length > 0 && (
            <p className="text-muted px-1 text-[11px] tracking-[0.15em] uppercase">
              {ARENA_COPY.restOfTop}
            </p>
          )}
          <ul className="space-y-2">
            {rest.map((entry) => (
              <RankingRow key={entry.key} entry={entry} maxPoints={maxPoints} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
