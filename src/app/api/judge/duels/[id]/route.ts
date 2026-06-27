import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

const completeSchema = z.object({
  arena: z.number().int().min(1).max(6),
  outcome: z.enum(['player_a', 'player_b', 'draw']),
  rounds: z.number().int().min(1).max(25),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['judge']);
    const { id } = await context.params;
    const duel = await ServiceFactory.create()
      .getDuelService()
      .getDuelsByJudge(session.userId)
      .then((duels) => duels.find((item) => item.id === id) ?? null);

    if (!duel) {
      return handleApiError(new Error('Duelo não encontrado'));
    }

    return jsonOk({ duel });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['judge']);
    const { id } = await context.params;
    const body = completeSchema.parse(await request.json());

    const duel = await ServiceFactory.create()
      .getDuelService()
      .completeDuel({
        duelId: id,
        judgeId: session.userId,
        ...body,
      });

    return jsonOk({ duel });
  } catch (error) {
    return handleApiError(error);
  }
}
