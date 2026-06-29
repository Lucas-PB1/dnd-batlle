import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

const updateSchema = z.object({
  isClassified: z.boolean().optional(),
  arena: z.number().int().min(1).max(6).optional(),
  outcome: z.enum(['player_a', 'player_b', 'draw']).optional(),
  rounds: z.number().int().min(1).max(25).optional(),
  notes: z.string().optional(),
  pointsA: z.number().int().min(0).optional(),
  pointsB: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin']);
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());

    const duel = await ServiceFactory.create().getDuelService().updateDuel({
      duelId: id,
      actorId: session.userId,
      roles: session.roles,
      ...body,
    });

    return jsonOk({ duel });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin']);
    const { id } = await context.params;

    await ServiceFactory.create().getDuelService().deleteDuel({
      duelId: id,
      actorId: session.userId,
      roles: session.roles,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
