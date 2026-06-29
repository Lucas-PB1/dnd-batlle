import {
  ARENA_COPY,
  formatRankLabel,
  rankTitle,
} from '@/shared/constants/arena-copy';

export const RANK_COLORS = {
  1: {
    ring: 'ring-amber-400/50',
    text: 'text-amber-300',
    pedestal: 'from-amber-500/80 via-amber-600/60 to-amber-900/90',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.15)]',
    badge: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
  },
  2: {
    ring: 'ring-stone-300/40',
    text: 'text-stone-200',
    pedestal: 'from-stone-300/70 via-stone-400/50 to-stone-700/80',
    glow: 'shadow-[0_0_24px_rgba(212,212,216,0.08)]',
    badge: 'bg-stone-300/10 text-stone-200 border-stone-300/25',
  },
  3: {
    ring: 'ring-orange-700/40',
    text: 'text-orange-300',
    pedestal: 'from-orange-700/70 via-amber-900/60 to-stone-900/90',
    glow: 'shadow-[0_0_20px_rgba(180,83,9,0.12)]',
    badge: 'bg-orange-900/30 text-orange-200 border-orange-700/30',
  },
} as const;

export function rankAccentClass(rank: number): string {
  if (rank === 1) return 'border-l-amber-400/70 bg-amber-500/[0.06]';
  if (rank === 2) return 'border-l-stone-300/50 bg-stone-400/[0.04]';
  if (rank === 3) return 'border-l-orange-600/60 bg-orange-900/[0.08]';
  return 'border-l-transparent bg-stone-950/20';
}

export function getRankColors(rank: number) {
  if (rank === 1) return RANK_COLORS[1];
  if (rank === 2) return RANK_COLORS[2];
  if (rank === 3) return RANK_COLORS[3];
  return null;
}

export function RankMedalIcon({ rank, className = 'h-5 w-5' }: { rank: number; className?: string }) {
  if (rank === 1) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="14" r="6" fill="currentColor" className="text-amber-500/30" />
        <path
          d="M8 4 10 9H6L4 4M16 4 14 9H18L20 4M12 9v2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-amber-300"
        />
      </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="13" r="6" fill="currentColor" className="text-stone-400/25" />
        <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" className="text-stone-300" />
      </svg>
    );
  }
  if (rank === 3) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="13" r="6" fill="currentColor" className="text-orange-800/40" />
        <path
          d="M9 13h6M12 10v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-orange-400/80"
        />
      </svg>
    );
  }
  return null;
}

export function RankLabel({
  rank,
  tied,
  size = 'md',
}: {
  rank: number;
  tied: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const colors = getRankColors(rank);
  const sizeClass =
    size === 'lg' ? 'text-lg font-black' : size === 'sm' ? 'text-xs font-semibold' : 'text-sm font-bold';

  return (
    <div className="flex items-center gap-1.5">
      {colors && <RankMedalIcon rank={rank} className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} />}
      <span className={`tabular-nums ${sizeClass} ${colors?.text ?? 'text-muted'}`}>
        {formatRankLabel(rank, tied)}
      </span>
      {tied && rank <= 3 && (
        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] tracking-wide uppercase">
          {ARENA_COPY.tiedRank}
        </span>
      )}
    </div>
  );
}

export function RankTierBadge({ rank }: { rank: number }) {
  const title = rankTitle(rank);
  const colors = getRankColors(rank);
  if (!title || !colors) return null;

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${colors.badge}`}>
      {title}
    </span>
  );
}
