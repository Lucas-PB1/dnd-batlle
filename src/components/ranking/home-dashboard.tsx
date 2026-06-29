'use client';

import { PublicDashboard } from '@/components/ranking/public-dashboard';
import type {
  CharacterRankingEntry,
  ClassStats,
  CompletedDuelSummary,
  PlayerRankingEntry,
} from '@/domain/entities';

interface HomeDashboardProps {
  characterRanking: CharacterRankingEntry[];
  playerRanking: PlayerRankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
}

export function HomeDashboard(props: HomeDashboardProps) {
  return <PublicDashboard {...props} />;
}
