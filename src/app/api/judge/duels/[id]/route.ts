import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';
import { hasAnyRole } from '@/shared/utils/roles';

const completeSchema = z.object({
  arena: z.number().int().min(1).max(6),
  outcome: z.enum(['player_a', 'player_b', 'draw']),
  rounds: z.number().int().min(1).max(25),
  notes: z.string().optional(),
  isClassified: z.boolean().optional(),
});

const updateSchema = z.object({
  isClassified: z.boolean().optional(),
  arena: z.number().int().min(1).max(6).optional(),
  outcome: z.enum(['player_a', 'player_b', 'draw']).optional(),
  rounds: z.number().int().min(1).max(25).optional(),
  notes: z.string().optional(),
  pointsA: z.number().int().min(0).optional(),
  pointsB: z.number().int().min(0).optional(),
});

async function getAccessibleDuel(id: string, session: Awaited<ReturnType<typeof requireSession>>) {
  const duelService = ServiceFactory.create().getDuelService();
  const duel = await duelService.getDuelById(id);
  if (!duel) return null;

  if (session.roles.includes('admin')) return duel;
  if (session.roles.includes('judge') && duel.judgeId === session.userId) return duel;

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['judge', 'admin']);
    const { id } = await context.params;
    const duel = await getAccessibleDuel(id, session);

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
    const session = await requireSession(['judge', 'admin']);
    const { id } = await context.params;
    const duelService = ServiceFactory.create().getDuelService();
    const duel = await getAccessibleDuel(id, session);

    if (!duel) {
      return handleApiError(new Error('Duelo não encontrado'));
    }

    const payload = await request.json();

    if (duel.status === 'completed') {
      const body = updateSchema.parse(payload);
      const updated = await duelService.updateDuel({
        duelId: id,
        actorId: session.userId,
        roles: session.roles,
        ...body,
      });
      return jsonOk({ duel: updated });
    }

    if (!hasAnyRole(session, ['judge']) || duel.judgeId !== session.userId) {
      return handleApiError(new Error('Sem permissão'));
    }

    const body = completeSchema.parse(payload);
    const completed = await duelService.completeDuel({
      duelId: id,
      judgeId: session.userId,
      ...body,
    });

    return jsonOk({ duel: completed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['judge', 'admin']);
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
