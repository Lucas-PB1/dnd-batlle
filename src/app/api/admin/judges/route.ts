import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET() {
  try {
    await requireSession(['admin']);
    const judges = await ServiceFactory.create().getAdminService().listJudges();
    return jsonOk({ judges });
  } catch (error) {
    return handleApiError(error);
  }
}

const createJudgeSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  displayName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    await requireSession(['admin']);
    const body = createJudgeSchema.parse(await request.json());
    const judge = await ServiceFactory.create().getAdminService().createJudge(body);
    return jsonOk({ judge }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
