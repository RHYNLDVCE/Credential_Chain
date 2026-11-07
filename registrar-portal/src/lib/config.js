import path from 'path';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Blockchain configuration (EVM Layer-2 / Local Anvil)
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  registrarPrivateKey: process.env.REGISTRAR_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',

  // Authentication & Security
  jwtSecret: process.env.JWT_SECRET || 'msu-tcto-academic-credential-secret-2026-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Institutional Identification
  institutionId: process.env.INSTITUTION_ID || 'MSU-TCTO',
  institutionName: process.env.INSTITUTION_NAME || 'Mindanao State University - Tawi-Tawi College of Technology and Oceanography',
  departmentName: process.env.DEPARTMENT_NAME || 'Office of the University Registrar',

  // Decentralized Content-Addressed Storage (IPFS)
  ipfsStorageMode: process.env.IPFS_STORAGE_MODE || 'local',
  pinataApiKey: process.env.PINATA_API_KEY || '',
  pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
  pinataJwt: process.env.PINATA_JWT || '',
  ipfsGateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',

  // Frontend / Public Verification Client
  verificationPortalUrl: process.env.VERIFICATION_PORTAL_URL || 'http://localhost:3000',

  // Storage Paths
  paths: {
    ipfsStorage: path.join(process.cwd(), 'uploads', 'ipfs'),
  },

  roles: {
    ADMIN: 'ADMIN',
    REGISTRAR: 'REGISTRAR',
    AUDITOR: 'AUDITOR',
  },
};

export default config;
