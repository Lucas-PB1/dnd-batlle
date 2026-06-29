import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET(request: Request) {
  try {
    await requireSession(['admin']);
    const includeInactive = new URL(request.url).searchParams.get('all') === '1';
    const characters = await ServiceFactory.create()
      .getAdminService()
      .listCharacters(includeInactive);
    return jsonOk({ characters });
  } catch (error) {
    return handleApiError(error);
  }
}
