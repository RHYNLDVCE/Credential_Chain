import { AuthController } from '@/controllers/authController.js';
import { requireAuth } from '@/lib/middleware/auth.js';

export async function POST(request) {
  const auth = requireAuth(request, 'ADMIN');
  if (!auth.authorized) return auth.errorResponse;
  return await AuthController.register(request);
}
