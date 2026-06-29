import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

export async function GET(request: Request) {
  try {
    await requireSession(['admin']);
    const includeRemoved = new URL(request.url).searchParams.get('all') === '1';
    const users = await ServiceFactory.create().getAdminService().listUsers(includeRemoved);
    return jsonOk({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  displayName: z.string().min(2),
  roles: z.array(z.enum(['admin', 'judge', 'player'])).min(1),
});

export async function POST(request: Request) {
  try {
    await requireSession(['admin']);
    const body = createUserSchema.parse(await request.json());
    const user = await ServiceFactory.create().getAdminService().createUser(body);
    return jsonOk({ user }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
