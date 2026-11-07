import { SystemController } from '@/controllers/systemController.js';

export async function GET() {
  return await SystemController.getHealth();
}
