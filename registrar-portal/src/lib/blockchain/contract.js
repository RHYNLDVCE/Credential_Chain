import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import config from '../config.js';
import { getProvider, getRegistrarSigner, getAdminSigner } from './provider.js';
import logger from '../utils/logger.js';

const abiPath = path.resolve(process.cwd(), 'src/lib/abi/AcademicCredentialSBT.json');
const rawAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
export const AcademicCredentialABI = rawAbi.abi || rawAbi;

let readOnlyContractInstance = null;
let registrarContractInstance = null;
let adminContractInstance = null;

export const getReadOnlyContract = () => {
  if (!readOnlyContractInstance) {
    const provider = getProvider();
    readOnlyContractInstance = new ethers.Contract(config.contractAddress, AcademicCredentialABI, provider);
  }
  return readOnlyContractInstance;
};

export const getRegistrarContract = () => {
  if (!registrarContractInstance) {
    const signer = getRegistrarSigner();
    registrarContractInstance = new ethers.Contract(config.contractAddress, AcademicCredentialABI, signer);
  }
  return registrarContractInstance;
};

export const getAdminContract = () => {
  if (!adminContractInstance) {
    const signer = getAdminSigner();
    adminContractInstance = new ethers.Contract(config.contractAddress, AcademicCredentialABI, signer);
  }
  return adminContractInstance;
};

export const verifyContractConnection = async () => {
  try {
    const contract = getReadOnlyContract();
    const name = await contract.name();
    const symbol = await contract.symbol();
    const registrarRole = await contract.REGISTRAR_ROLE();
    const registrarSigner = getRegistrarSigner();
    const isRegistrar = await contract.hasRole(registrarRole, registrarSigner.address);

    const totalIssued = await contract.totalCredentialsIssued();
    const totalRevoked = await contract.totalCredentialsRevoked();
    const totalActive = await contract.totalActiveCredentials();

    return {
      connected: true,
      name,
      symbol,
      address: config.contractAddress,
      registrarAddress: registrarSigner.address,
      isRegistrarAuthorized: isRegistrar,
      totalIssued: totalIssued.toString(),
      totalRevoked: totalRevoked.toString(),
      totalActive: totalActive.toString(),
    };
  } catch (err) {
    logger.error('Contract verification failed:', err.message);
    return {
      connected: false,
      error: err.message,
    };
  }
};

export default {
  AcademicCredentialABI,
  getReadOnlyContract,
  getRegistrarContract,
  getAdminContract,
  verifyContractConnection,
};
