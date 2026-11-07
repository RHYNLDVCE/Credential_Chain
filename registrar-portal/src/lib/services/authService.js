import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import config from '../config.js';
import dbService from './dbService.js';
import logger from '../utils/logger.js';
import { getReadOnlyContract } from '../blockchain/contract.js';
import { getRegistrarSigner, getAdminSigner } from '../blockchain/provider.js';

export const seedDefaultUsers = async () => {
  try {
    const existingAdmin = await dbService.findUserByEmail('admin@msu.edu.ph');
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await dbService.saveUser({
        id: 'usr_admin_default',
        email: 'admin@msu.edu.ph',
        name: 'Institutional Governance Admin',
        role: config.roles.ADMIN,
        passwordHash,
        department: config.departmentName,
      });
      logger.info('Default Admin user seeded: admin@msu.edu.ph');
    }

    const existingRegistrar = await dbService.findUserByEmail('registrar@msu.edu.ph');
    if (!existingRegistrar) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('registrar123', salt);
      await dbService.saveUser({
        id: 'usr_registrar_default',
        email: 'registrar@msu.edu.ph',
        name: 'Chief Registrar Officer',
        role: config.roles.REGISTRAR,
        passwordHash,
        department: config.departmentName,
      });
      logger.info('Default Registrar user seeded: registrar@msu.edu.ph');
    }
  } catch (err) {
    logger.warn('Could not seed default users: ' + err.message);
  }
};

export const login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Ensure default accounts exist
  await seedDefaultUsers();

  const user = await dbService.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  await dbService.logAudit({
    action: 'USER_LOGIN',
    performedBy: user.email,
    details: { role: user.role },
  });

  return {
    token,
    user: payload,
    expiresIn: config.jwtExpiresIn,
  };
};

export const loginWithMetaMask = async (address, signature, message) => {
  if (!address || !signature || !message) {
    throw new Error('Wallet address, cryptographic signature, and challenge message are required');
  }

  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum wallet address format');
  }

  const checksumAddress = ethers.getAddress(address);

  // 1. Verify cryptographic signature
  let recoveredAddress;
  try {
    recoveredAddress = ethers.verifyMessage(message, signature);
  } catch (err) {
    throw new Error('Failed to verify cryptographic signature: ' + err.message);
  }

  if (recoveredAddress.toLowerCase() !== checksumAddress.toLowerCase()) {
    throw new Error('Cryptographic signature verification failed: recovered address does not match.');
  }

  // 2. Validate timestamp in message to prevent replay (allow 10 min window)
  const timestampMatch = message.match(/Timestamp:\s*(\d+)/i);
  if (timestampMatch) {
    const challengeTime = parseInt(timestampMatch[1], 10);
    const now = Date.now();
    if (Math.abs(now - challengeTime) > 10 * 60 * 1000) {
      throw new Error('Authentication challenge has expired. Please sign again.');
    }
  }

  // 3. Inspect on-chain smart contract roles
  let role = config.roles.REGISTRAR;
  let isContractAdmin = false;
  let isContractRegistrar = false;

  try {
    const contract = getReadOnlyContract();
    const adminRoleHash = await contract.DEFAULT_ADMIN_ROLE();
    const registrarRoleHash = await contract.REGISTRAR_ROLE();

    const [hasAdmin, hasRegistrar] = await Promise.all([
      contract.hasRole(adminRoleHash, checksumAddress),
      contract.hasRole(registrarRoleHash, checksumAddress),
    ]);

    isContractAdmin = Boolean(hasAdmin);
    isContractRegistrar = Boolean(hasRegistrar);

    if (isContractAdmin) {
      role = config.roles.ADMIN;
    } else if (isContractRegistrar) {
      role = config.roles.REGISTRAR;
    }
  } catch (err) {
    logger.warn('Could not query on-chain roles for wallet: ' + err.message);
  }

  // 4. Also match configured registrar / admin server addresses
  try {
    const configuredRegistrar = getRegistrarSigner().address.toLowerCase();
    const configuredAdmin = getAdminSigner().address.toLowerCase();

    if (checksumAddress.toLowerCase() === configuredAdmin) {
      role = config.roles.ADMIN;
      isContractAdmin = true;
    } else if (checksumAddress.toLowerCase() === configuredRegistrar) {
      role = config.roles.REGISTRAR;
      isContractRegistrar = true;
    }
  } catch (err) {
    logger.warn('Could not query configured signers: ' + err.message);
  }

  // 5. Look up or create user in DB
  const email = `wallet_${checksumAddress.toLowerCase().slice(0, 10)}@msu.edu.ph`;
  let user = await dbService.findUserByEmail(email);

  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(checksumAddress + config.jwtSecret, salt);
    user = await dbService.saveUser({
      id: `usr_web3_${checksumAddress.toLowerCase().slice(2, 10)}`,
      email,
      name: `MetaMask Staff (${checksumAddress.slice(0, 6)}...${checksumAddress.slice(-4)})`,
      role,
      passwordHash,
      department: config.departmentName,
    });
  } else if (user.role !== role) {
    user = await dbService.saveUser({
      ...user,
      role,
    });
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    walletAddress: checksumAddress,
    isContractAdmin,
    isContractRegistrar,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  await dbService.logAudit({
    action: 'USER_METAMASK_LOGIN',
    performedBy: checksumAddress,
    details: {
      address: checksumAddress,
      role: user.role,
      isContractAdmin,
      isContractRegistrar,
    },
  });

  return {
    token,
    user: payload,
    expiresIn: config.jwtExpiresIn,
  };
};

export const registerUser = async ({ email, password, name, role = config.roles.REGISTRAR, department }) => {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }

  const existing = await dbService.findUserByEmail(email);
  if (existing) {
    throw new Error('A user with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = {
    email: email.toLowerCase().trim(),
    name: name.trim(),
    role: role.toUpperCase(),
    department: department || config.departmentName,
    passwordHash,
  };

  const saved = await dbService.saveUser(newUser);

  return {
    id: saved.id,
    email: saved.email,
    name: saved.name,
    role: saved.role,
    department: saved.department,
    createdAt: saved.createdAt,
  };
};

export default {
  seedDefaultUsers,
  login,
  loginWithMetaMask,
  registerUser,
};
