import { VerificationController } from '@/controllers/verificationController.js';

export async function GET(request, { params }) {
  const { tokenId } = await params;
  return await VerificationController.verifyById(tokenId);
}
