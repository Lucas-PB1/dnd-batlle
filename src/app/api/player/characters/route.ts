import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    const session = await requireSession(['player']);
    const characters = await ServiceFactory.create()
      .getCharacterService()
      .listByPlayer(session.userId);
    return jsonOk({ characters });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  characterClass: z.string().min(2),
  subclass: z.string().optional(),
  description: z.string().max(500).optional(),
  portraitUrl: z.string().optional(),
  generation: z.string().max(80).optional(),
  isDead: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(['player']);
    const body = createSchema.parse(await request.json());
    const character = await ServiceFactory.create().getCharacterService().create({
      playerId: session.userId,
      ...body,
    });
    return jsonOk({ character }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
