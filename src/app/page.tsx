import { PublicDashboard } from '@/components/ranking/public-dashboard';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export default async function HomePage() {
  const stats = await ServiceFactory.create().getRankingService().getPublicStats();

  return (
    <PublicDashboard
      ranking={stats.ranking}
      classStats={stats.classStats}
      totalDuels={stats.totalDuels}
      recentDuels={stats.recentDuels}
    />
  );
}
