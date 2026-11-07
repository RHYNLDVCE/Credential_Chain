import { CredentialController } from '@/controllers/credentialController.js';
import { requireAuth } from '@/lib/middleware/auth.js';

export async function GET(request, { params }) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.errorResponse;

  const { tokenId } = await params;
  const { searchParams } = new URL(request.url);
  return await CredentialController.getQr(tokenId, searchParams);
}
