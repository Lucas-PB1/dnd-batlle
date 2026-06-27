import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    const stats = await ServiceFactory.create().getRankingService().getPublicStats();
    return jsonOk(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
