import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? 'Dados inválidos', 400);
  }
  if (error instanceof Error) {
    if (error.message === 'Não autenticado') return jsonError(error.message, 401);
    if (error.message === 'Sem permissão') return jsonError(error.message, 403);
    return jsonError(error.message, 400);
  }
  return jsonError('Erro interno', 500);
}
