import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    await requireSession(['admin']);
    const duels = await ServiceFactory.create().getDuelService().getAllDuels();
    return jsonOk({ duels });
  } catch (error) {
    return handleApiError(error);
  }
}
