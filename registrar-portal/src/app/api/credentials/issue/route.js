import { CredentialController } from '@/controllers/credentialController.js';
import { requireAuth } from '@/lib/middleware/auth.js';

export async function POST(request) {
  const auth = requireAuth(request, 'REGISTRAR', 'ADMIN', 'OFFICER');
  if (!auth.authorized) return auth.errorResponse;
  return await CredentialController.issue(request, auth.user);
}
