import { cookies } from 'next/headers';
import { jsonOk } from '@/lib/api-response';
import { SESSION_COOKIE } from '@/shared/constants/game-rules';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return jsonOk({ ok: true });
}
