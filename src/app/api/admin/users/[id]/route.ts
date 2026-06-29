import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  roles: z.array(z.enum(['admin', 'judge', 'player'])).min(1).optional(),
  active: z.boolean().optional(),
  password: z.string().min(4).optional(),
  resetPassword: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin']);
    const { id } = await context.params;
    const body = updateUserSchema.parse(await request.json());

    if (session.userId === id && body.roles && !body.roles.includes('admin')) {
      return handleApiError(new Error('Você não pode remover seu próprio papel de admin'));
    }

    const adminService = ServiceFactory.create().getAdminService();

    if (body.resetPassword) {
      if (!body.password) {
        return handleApiError(new Error('Informe a nova senha'));
      }
      const user = await adminService.resetUserPassword(id, body.password);
      return jsonOk({ user });
    }

    const user = await adminService.updateUser(id, {
      displayName: body.displayName,
      email: body.email,
      roles: body.roles,
      active: body.active,
      password: body.password,
    });

    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
