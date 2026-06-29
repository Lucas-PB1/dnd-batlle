'use client';

import { useState } from 'react';
import {
  CharacterRankingBoard,
  PlayerRankingBoard,
} from '@/components/ranking/ranking-boards';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type {
  CharacterRankingEntry,
  ClassStats,
  CompletedDuelSummary,
  PlayerRankingEntry,
} from '@/domain/entities';
import { ARENAS } from '@/shared/constants/game-rules';
import { ARENA_COPY } from '@/shared/constants/arena-copy';

const RANKING_MODES = [
  { id: 'characters', icon: '🛡', label: ARENA_COPY.characterTab },
  { id: 'players', icon: '⚔', label: ARENA_COPY.playerTab },
] as const;

function StatTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-stone-950/50 px-4 py-3">
      <span className="text-lg opacity-80" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-muted text-[10px] tracking-wide uppercase">{label}</p>
        <p className="text-accent text-xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}

function RankModeToggle({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="inline-flex gap-1 rounded-xl border border-white/[0.08] bg-stone-950/50 p-1"
      role="tablist"
    >
      {RANKING_MODES.map((mode) => {
        const active = activeId === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={mode.label}
            onClick={() => onChange(mode.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm',
              active
                ? 'bg-accent text-stone-950 shadow-sm'
                : 'text-muted hover:bg-white/5 hover:text-foreground',
            )}
          >
            <span aria-hidden>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function outcomeLabel(outcome: CompletedDuelSummary['outcome'], a: string, b: string) {
  if (outcome === 'draw') return 'Empate';
  if (outcome === 'player_a') return `${a} venceu`;
  return `${b} venceu`;
}

export function PublicDashboard({
  characterRanking,
  playerRanking,
  classStats,
  totalDuels,
  recentDuels,
}: {
  characterRanking: CharacterRankingEntry[];
  playerRanking: PlayerRankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
}) {
  const [rankTab, setRankTab] = useState<string>('characters');
  const leaderGlory = Math.max(characterRanking[0]?.points ?? 0, playerRanking[0]?.points ?? 0);

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.08] bg-gradient-to-br from-stone-900/80 to-stone-950/90">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-accent/90 text-[11px] tracking-[0.22em] uppercase">
              {ARENA_COPY.siteTagline}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {ARENA_COPY.rankingTitle}
            </h1>
            <p className="text-muted mt-2 max-w-xl text-sm">{ARENA_COPY.rankingSubtitle}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile icon="⚔" label="Duelos" value={totalDuels} />
            <StatTile icon="🛡" label="Heróis" value={characterRanking.length} />
            <StatTile icon="✦" label="Topo GLR" value={leaderGlory} />
          </div>
        </div>
      </Card>

      <section className="rounded-2xl border border-white/[0.08] bg-stone-950/40 p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold sm:text-lg">{ARENA_COPY.topRanking}</h2>
            <p className="text-muted text-xs sm:text-sm">{ARENA_COPY.topRankingHint}</p>
          </div>
          <RankModeToggle activeId={rankTab} onChange={setRankTab} />
        </div>

        {rankTab === 'characters' ? (
          <CharacterRankingBoard ranking={characterRanking} />
        ) : (
          <PlayerRankingBoard ranking={playerRanking} />
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/[0.06] bg-stone-950/30">
          <CardTitle className="text-base">{ARENA_COPY.classDominance}</CardTitle>
          <CardDescription>Taxa de vitória por classe</CardDescription>
          <div className="mt-4 space-y-3">
            {classStats.length === 0 && (
              <p className="text-muted text-sm">{ARENA_COPY.noDuelsYet}</p>
            )}
            {classStats.slice(0, 8).map((stat) => (
              <div
                key={stat.characterClass}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
              >
                <span className="truncate text-sm">{stat.characterClass}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                    {stat.winRate}%
                  </span>
                  <span className="text-muted text-[11px] tabular-nums">{stat.total}d</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-white/[0.06] bg-stone-950/30">
          <CardTitle className="text-base">{ARENA_COPY.recentChronicles}</CardTitle>
          <CardDescription>Últimos vereditos do coliseu</CardDescription>
          <div className="mt-4 divide-y divide-white/[0.05]">
            {recentDuels.length === 0 && (
              <p className="text-muted text-sm">{ARENA_COPY.noDuelsYet}</p>
            )}
            {recentDuels.slice(0, 6).map((duel) => (
              <article key={duel.id} className="py-3 first:pt-0">
                <p className="text-sm font-medium leading-snug">
                  {duel.playerAName} <span className="text-muted font-normal">vs</span>{' '}
                  {duel.playerBName}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
                    {outcomeLabel(duel.outcome, duel.playerAName, duel.playerBName)}
                  </span>
                  <span className="text-muted rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px]">
                    {duel.rounds}r
                  </span>
                  {duel.arena && (
                    <span className="text-muted rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px]">
                      {ARENAS[duel.arena]?.name ?? duel.arena}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
