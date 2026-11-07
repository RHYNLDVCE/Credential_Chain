import { VerificationController } from '@/controllers/verificationController.js';

export async function POST(request) {
  return await VerificationController.verifyDocument(request);
}
