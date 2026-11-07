import { getRegistrarSigner } from './provider.js';
import logger from '../utils/logger.js';

let txMutex = Promise.resolve();

/**
 * Sequential transaction queue runner with automatic nonce management
 */
export const runExclusiveTx = async (txOperation) => {
  const currentTask = txMutex.then(async () => {
    const signer = getRegistrarSigner();

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const nonce = await signer.getNonce('pending');
        return await txOperation({ nonce });
      } catch (err) {
        if ((err.code === 'NONCE_EXPIRED' || err.message?.includes('nonce')) && attempt === 1) {
          logger.warn(`Nonce collision detected, retrying with fresh pending nonce...`);
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        throw err;
      }
    }
  });

  txMutex = currentTask.catch(() => {});
  return await currentTask;
};

export default {
  runExclusiveTx,
};
