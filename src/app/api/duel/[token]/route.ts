import { z } from 'zod';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';
import { CHARACTER_CLASSES } from '@/shared/constants/game-rules';
import { getSession } from '@/lib/auth';
import type { Character } from '@/domain/entities';

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

    const session = await getSession();
    let characters: Character[] = [];

    if (session?.roles.includes('player')) {
      characters = await ServiceFactory.create()
        .getCharacterService()
        .listByPlayer(session.userId);
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
      characters,
      session,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const registerSchema = z.union([
  z.object({
    slot: z.enum(['A', 'B']),
    characterId: z.string().min(1),
    seasonPointsBefore: z.number().int().min(0).default(0),
  }),
  z.object({
    slot: z.enum(['A', 'B']),
    name: z.string().min(2),
    characterClass: z.string().min(2),
    subclass: z.string().optional(),
    seasonPointsBefore: z.number().int().min(0).default(0),
  }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = registerSchema.parse(await request.json());
    const session = await getSession();

    const payload =
      'characterId' in body
        ? {
            token,
            slot: body.slot,
            characterId: body.characterId,
            playerId: session?.userId,
            seasonPointsBefore: body.seasonPointsBefore,
          }
        : {
            token,
            ...body,
          };

    if ('characterId' in body && !session?.roles.includes('player')) {
      return handleApiError(new Error('Faça login como jogador para usar personagem cadastrado'));
    }

    const duel = await ServiceFactory.create().getDuelService().registerPlayer(payload);

    return jsonOk({ duel });
  } catch (error) {
    return handleApiError(error);
  }
}
