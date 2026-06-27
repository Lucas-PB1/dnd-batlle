import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

const toggleSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(['admin']);
    const { id } = await context.params;
    const body = toggleSchema.parse(await request.json());
    const judge = await ServiceFactory.create()
      .getAdminService()
      .toggleJudgeActive(id, body.active);
    return jsonOk({ judge });
  } catch (error) {
    return handleApiError(error);
  }
}
