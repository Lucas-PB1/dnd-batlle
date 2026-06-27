import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    const session = await requireSession(['judge']);
    const duels = await ServiceFactory.create()
      .getDuelService()
      .getDuelsByJudge(session.userId);
    return jsonOk({ duels });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  isClassified: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(['judge']);
    const body = createSchema.parse(await request.json());
    const duel = await ServiceFactory.create().getDuelService().createDuel({
      judgeId: session.userId,
      isClassified: body.isClassified,
    });
    return jsonOk({ duel }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
