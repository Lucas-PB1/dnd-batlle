import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ServiceFactory } from '@/infrastructure/factories/service-factory';
import { handleApiError, jsonOk } from '@/lib/api-response';
import { SESSION_COOKIE } from '@/shared/constants/game-rules';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const authService = ServiceFactory.create().getAuthService();
    const result = await authService.login(body.username, body.password);

    if (!result) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return jsonOk({ session: result.session });
  } catch (error) {
    return handleApiError(error);
  }
}
