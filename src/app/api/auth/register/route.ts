import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { SESSION_COOKIE } from '@/shared/constants/game-rules';

const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(4, 'Senha muito curta'),
  displayName: z.string().min(2, 'Nome obrigatório'),
});

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const authService = ServiceFactory.create().getAuthService();
    const user = await authService.register(body);

    const login = await authService.login(body.email, body.password);
    if (!login) {
      return jsonOk({ user }, 201);
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, login.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return jsonOk({ user, session: login.session }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('já cadastrado')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return handleApiError(error);
  }
}
