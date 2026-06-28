import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    const session = await requireSession(['player']);
    const stats = await ServiceFactory.create()
      .getRankingService()
      .getPlayerStats(session.userId);
    const characters = await ServiceFactory.create()
      .getCharacterService()
      .listByPlayer(session.userId);

    return jsonOk({ stats, characters, session });
  } catch (error) {
    return handleApiError(error);
  }
}
