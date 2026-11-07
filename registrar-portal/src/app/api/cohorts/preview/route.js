import { CohortController } from '@/controllers/cohortController.js';
import { requireAuth } from '@/lib/middleware/auth.js';

export async function POST(request) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.errorResponse;
  return await CohortController.preview(request);
}
