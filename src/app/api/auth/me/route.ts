import { getSession } from '@/lib/auth';
import { handleApiError, jsonOk } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await getSession();
    return jsonOk({ session });
  } catch (error) {
    return handleApiError(error);
  }
}
