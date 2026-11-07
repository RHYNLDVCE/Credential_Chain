import { ethers } from 'ethers';
import config from '../config.js';
import logger from '../utils/logger.js';

let providerInstance = null;
let registrarSignerInstance = null;
let adminSignerInstance = null;

export const getProvider = () => {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(config.rpcUrl);
  }
  return providerInstance;
};

export const getRegistrarSigner = () => {
  if (!registrarSignerInstance) {
    const provider = getProvider();
    registrarSignerInstance = new ethers.Wallet(config.registrarPrivateKey, provider);
  }
  return registrarSignerInstance;
};

export const getAdminSigner = () => {
  if (!adminSignerInstance) {
    const provider = getProvider();
    adminSignerInstance = new ethers.Wallet(config.adminPrivateKey, provider);
  }
  return adminSignerInstance;
};

export const getBlockchainStatus = async () => {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const registrarSigner = getRegistrarSigner();
    const registrarAddress = registrarSigner.address;
    const registrarBalance = await provider.getBalance(registrarAddress);

    return {
      connected: true,
      chainId: network.chainId.toString(),
      blockNumber,
      registrarAddress,
      registrarBalanceEth: ethers.formatEther(registrarBalance),
    };
  } catch (err) {
    logger.error('Failed to get blockchain status:', err.message);
    return {
      connected: false,
      error: err.message,
    };
  }
};

export default {
  getProvider,
  getRegistrarSigner,
  getAdminSigner,
  getBlockchainStatus,
};
