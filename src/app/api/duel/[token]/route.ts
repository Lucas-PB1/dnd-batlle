import { z } from 'zod';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';
import { CHARACTER_CLASSES } from '@/shared/constants/game-rules';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const duel = await ServiceFactory.create().getDuelService().getDuelByToken(token);
    if (!duel) {
      return handleApiError(new Error('Link inválido ou expirado'));
    }

    return jsonOk({
      duel: {
        token: duel.token,
        status: duel.status,
        isClassified: duel.isClassified,
        playerA: duel.playerA,
        playerB: duel.playerB,
        judgeName: duel.judgeName,
      },
      classes: CHARACTER_CLASSES,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const registerSchema = z.object({
  slot: z.enum(['A', 'B']),
  name: z.string().min(2),
  characterClass: z.string().min(2),
  subclass: z.string().optional(),
  seasonPointsBefore: z.number().int().min(0).default(0),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = registerSchema.parse(await request.json());

    const duel = await ServiceFactory.create()
      .getDuelService()
      .registerPlayer({
        token,
        ...body,
      });

    return jsonOk({ duel });
  } catch (error) {
    return handleApiError(error);
  }
}
