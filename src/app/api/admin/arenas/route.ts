import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    await requireSession(['admin']);
    const arenas = await ServiceFactory.create().getArenaService().listAll(true);
    return jsonOk({ arenas });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  diceValue: z.number().int().min(1).max(100),
  name: z.string().min(2),
  effect: z.string().min(2),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireSession(['admin']);
    const body = createSchema.parse(await request.json());
    const arena = await ServiceFactory.create().getArenaService().create(body);
    return jsonOk({ arena }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
