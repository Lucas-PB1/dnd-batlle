import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

const updateSchema = z.object({
  diceValue: z.number().int().min(1).max(100).optional(),
  name: z.string().min(2).optional(),
  effect: z.string().min(2).optional(),
  description: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(['admin']);
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const arena = await ServiceFactory.create().getArenaService().update(id, body);
    return jsonOk({ arena });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(['admin']);
    const { id } = await context.params;
    const arena = await ServiceFactory.create().getArenaService().delete(id);
    return jsonOk({ arena });
  } catch (error) {
    return handleApiError(error);
  }
}
