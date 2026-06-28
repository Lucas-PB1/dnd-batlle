import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  characterClass: z.string().min(2).optional(),
  subclass: z.string().optional(),
  description: z.string().max(500).optional(),
  portraitUrl: z.string().nullable().optional(),
  generation: z.string().max(80).optional(),
  isDead: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['player']);
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const character = await ServiceFactory.create()
      .getCharacterService()
      .update(id, session.userId, body);
    return jsonOk({ character });
  } catch (error) {
    return handleApiError(error);
  }
}
