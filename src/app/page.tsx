import { HomeDashboard } from '@/components/ranking/home-dashboard';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export default async function HomePage() {
  const stats = await ServiceFactory.create().getRankingService().getPublicStats();

  return (
    <HomeDashboard
      ranking={stats.ranking}
      classStats={stats.classStats}
      totalDuels={stats.totalDuels}
      recentDuels={stats.recentDuels}
    />
  );
}
