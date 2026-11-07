import { AuthController } from '@/controllers/authController.js';

export async function POST(request) {
  return await AuthController.loginWithMetaMask(request);
}
