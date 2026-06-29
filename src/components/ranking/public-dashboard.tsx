'use client';

import { useState, type ComponentType, type SVGProps } from 'react';
import {
  BoltIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
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

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const RANKING_MODES = [
  { id: 'characters', icon: ShieldCheckIcon, label: ARENA_COPY.characterTab },
  { id: 'players', icon: UserGroupIcon, label: ARENA_COPY.playerTab },
] as const;

const CLASS_BAR_COLORS = [
  'from-violet-500 to-violet-300',
  'from-sky-500 to-sky-300',
  'from-emerald-500 to-emerald-300',
  'from-amber-500 to-amber-300',
  'from-rose-500 to-rose-300',
  'from-accent-secondary to-violet-300',
  'from-sky-400 to-emerald-300',
  'from-amber-400 to-rose-300',
] as const;

function IconBadge({
  icon: Icon,
  tone,
}: {
  icon: HeroIcon;
  tone: 'amber' | 'violet' | 'sky' | 'emerald' | 'rose';
}) {
  const tones = {
    amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
    violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/25',
    sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/25',
    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
    rose: 'bg-rose-500/15 text-rose-300 ring-rose-500/25',
  };

  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
        tones[tone],
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: HeroIcon;
  label: string;
  value: string | number;
  tone: 'amber' | 'violet' | 'sky' | 'emerald' | 'rose';
}) {
  return (
    <div className="border-card-border/80 bg-surface-elevated/60 flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-sm">
      <IconBadge icon={icon} tone={tone} />
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
      className="border-card-border/80 bg-surface/80 inline-flex gap-1 rounded-xl border p-1"
      role="tablist"
    >
      {RANKING_MODES.map((mode) => {
        const active = activeId === mode.id;
        const Icon = mode.icon;
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
                ? 'bg-accent text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'text-muted hover:bg-white/5 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: HeroIcon;
  title: string;
  description: string;
  tone: 'violet' | 'emerald';
}) {
  return (
    <div className="flex items-start gap-3">
      <IconBadge icon={Icon} tone={tone} />
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </div>
  );
}

function ClassDominancePanel({ classStats }: { classStats: ClassStats[] }) {
  const maxTotal = Math.max(...classStats.map((s) => s.total), 1);

  return (
    <Card className={cn('panel-violet overflow-hidden')}>
      <PanelHeader
        icon={ChartBarIcon}
        title={ARENA_COPY.classDominance}
        description="Taxa de vitória por classe"
        tone="violet"
      />
      <div className="mt-5 space-y-3">
        {classStats.length === 0 && (
          <p className="text-muted text-sm">{ARENA_COPY.noDuelsYet}</p>
        )}
        {classStats.slice(0, 8).map((stat, index) => (
          <div
            key={stat.characterClass}
            className="bg-surface/60 border-card-border/50 rounded-xl border px-3 py-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium">{stat.characterClass}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {stat.winRate}%
                </span>
                <span className="text-muted text-[11px] tabular-nums">{stat.total}d</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-900/80">
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r transition-all',
                  CLASS_BAR_COLORS[index % CLASS_BAR_COLORS.length],
                )}
                style={{ width: `${Math.max((stat.total / maxTotal) * 100, 8)}%` }}
              />
            </div>
            <p className="text-muted mt-1.5 text-[10px]">
              {stat.wins}V · {stat.draws}E · {stat.losses}D
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function outcomeMeta(outcome: CompletedDuelSummary['outcome']) {
  if (outcome === 'draw') {
    return {
      label: 'Empate',
      icon: BoltIcon,
      tone: 'sky' as const,
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
    };
  }
  return {
    label: 'Vitória',
    icon: TrophyIcon,
    tone: 'amber' as const,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  };
}

function ChroniclesPanel({ recentDuels }: { recentDuels: CompletedDuelSummary[] }) {
  return (
    <Card className={cn('panel-emerald overflow-hidden')}>
      <PanelHeader
        icon={BookOpenIcon}
        title={ARENA_COPY.recentChronicles}
        description="Últimos vereditos do coliseu"
        tone="emerald"
      />
      <div className="mt-5 space-y-3">
        {recentDuels.length === 0 && (
          <p className="text-muted text-sm">{ARENA_COPY.noDuelsYet}</p>
        )}
        {recentDuels.slice(0, 6).map((duel) => {
          const meta = outcomeMeta(duel.outcome);
          const MetaIcon = meta.icon;
          const winner =
            duel.outcome === 'draw'
              ? 'Empate sangrento'
              : duel.outcome === 'player_a'
                ? `${duel.playerAName} venceu`
                : `${duel.playerBName} venceu`;

          return (
            <article
              key={duel.id}
              className={cn(
                'bg-surface/60 border-card-border/50 flex gap-3 rounded-xl border p-3',
                meta.border,
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                  meta.bg,
                  meta.tone === 'amber' ? 'text-amber-300 ring-amber-500/20' : 'text-sky-300 ring-sky-500/20',
                )}
              >
                <MetaIcon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">
                  {duel.playerAName}{' '}
                  <span className="text-muted font-normal">vs</span> {duel.playerBName}
                </p>
                <p className="text-muted mt-0.5 text-xs">
                  {duel.playerAClass} · {duel.playerBClass}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]',
                      meta.bg,
                      meta.border,
                    )}
                  >
                    {winner}
                  </span>
                  <span className="text-muted inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
                    <ClockIcon className="h-3 w-3" aria-hidden />
                    {duel.rounds}r
                  </span>
                  {duel.arena != null && (
                    <span className="text-muted inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200">
                      <MapPinIcon className="h-3 w-3" aria-hidden />
                      {ARENAS[duel.arena]?.name ?? duel.arena}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
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
      <Card className="panel-amber ranking-hero overflow-hidden">
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
            <StatTile icon={BoltIcon} label="Duelos" value={totalDuels} tone="rose" />
            <StatTile icon={ShieldCheckIcon} label="Heróis" value={characterRanking.length} tone="sky" />
            <StatTile icon={SparklesIcon} label="Topo GLR" value={leaderGlory} tone="amber" />
          </div>
        </div>
      </Card>

      <section className="border-card-border/80 bg-surface/70 rounded-2xl border p-4 backdrop-blur-sm sm:p-5">
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
        <ClassDominancePanel classStats={classStats} />
        <ChroniclesPanel recentDuels={recentDuels} />
      </div>
    </div>
  );
}
