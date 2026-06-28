'use client';

import { useState } from 'react';
import { PublicDashboard } from '@/components/ranking/public-dashboard';
import { RulesGuide } from '@/components/rules/rules-guide';
import { Tabs } from '@/components/ui/tabs';
import type { ClassStats, CompletedDuelSummary, RankingEntry } from '@/domain/entities';

const HOME_TABS = [
  { id: 'ranking', label: 'Ranking' },
  { id: 'regras', label: 'Regras' },
] as const;

type HomeTabId = (typeof HOME_TABS)[number]['id'];

interface HomeDashboardProps {
  ranking: RankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
  initialTab?: HomeTabId;
}

export function HomeDashboard({
  ranking,
  classStats,
  totalDuels,
  recentDuels,
  initialTab = 'ranking',
}: HomeDashboardProps) {
  const [activeTab, setActiveTab] = useState<HomeTabId>(initialTab);

  return (
    <div className="space-y-6">
      <Tabs tabs={HOME_TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as HomeTabId)} />

      {activeTab === 'ranking' ? (
        <PublicDashboard
          ranking={ranking}
          classStats={classStats}
          totalDuels={totalDuels}
          recentDuels={recentDuels}
        />
      ) : (
        <RulesGuide compact />
      )}
    </div>
  );
}
