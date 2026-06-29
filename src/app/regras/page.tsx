import { RulesGuide } from '@/components/rules/rules-guide';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export default async function RulesPage() {
  const arenas = await ServiceFactory.create().getArenaService().listAll();
  return <RulesGuide arenas={arenas} />;
}
