import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    const arenas = await ServiceFactory.create().getArenaService().listAll();
    return jsonOk({ arenas });
  } catch (error) {
    return handleApiError(error);
  }
}
