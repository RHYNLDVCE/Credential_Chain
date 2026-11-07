import { CohortController } from '@/controllers/cohortController.js';
import { requireAuth } from '@/lib/middleware/auth.js';

export async function GET(request) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.errorResponse;
  return await CohortController.list(request);
}
