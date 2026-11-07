import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config.js';
import logger from '../utils/logger.js';

const toBase32 = (buf) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
};

export const computeCIDv1 = (contentBuffer) => {
  const hash = crypto.createHash('sha256').update(contentBuffer).digest();
  const multihashPrefix = Buffer.from([0x01, 0x55, 0x12, 0x20]);
  const cidBytes = Buffer.concat([multihashPrefix, hash]);
  return `b${toBase32(cidBytes)}`;
};

const ensureStorageDir = () => {
  if (!fs.existsSync(config.paths.ipfsStorage)) {
    fs.mkdirSync(config.paths.ipfsStorage, { recursive: true });
  }
};

const cacheLocalContent = (cid, buffer, mimeType) => {
  ensureStorageDir();
  const filePath = path.join(config.paths.ipfsStorage, cid);
  fs.writeFileSync(filePath, buffer);

  const metaPath = path.join(config.paths.ipfsStorage, `${cid}.meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify({ cid, mimeType, createdAt: new Date().toISOString() }, null, 2));
};

export const pinJSONToIPFS = async (metadata, name = 'academic-credential-metadata') => {
  const contentString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata, null, 2);
  const buffer = Buffer.from(contentString, 'utf8');

  if (config.pinataJwt && config.ipfsStorageMode === 'pinata') {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.pinataJwt}`,
        },
        body: JSON.stringify({
          pinataContent: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
          pinataMetadata: { name },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const cid = result.IpfsHash;
        cacheLocalContent(cid, buffer, 'application/json');
        return { cid, gatewayUrl: `${config.ipfsGateway}${cid}`, provider: 'pinata' };
      }
    } catch (err) {
      logger.warn(`Pinata network error: ${err.message}. Falling back to local content store.`);
    }
  }

  const cid = computeCIDv1(buffer);
  cacheLocalContent(cid, buffer, 'application/json');

  return {
    cid,
    gatewayUrl: `/api/ipfs/${cid}`,
    provider: 'local-cas',
  };
};

export const pinFileToIPFS = async (fileBuffer, filename = 'diploma.pdf', mimeType = 'application/pdf') => {
  if (config.pinataJwt && config.ipfsStorageMode === 'pinata') {
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimeType });
      formData.append('file', blob, filename);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.pinataJwt}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const cid = result.IpfsHash;
        cacheLocalContent(cid, fileBuffer, mimeType);
        return { cid, gatewayUrl: `${config.ipfsGateway}${cid}`, provider: 'pinata' };
      }
    } catch (err) {
      logger.warn(`Pinata file pin error: ${err.message}. Falling back to local content store.`);
    }
  }

  const cid = computeCIDv1(fileBuffer);
  cacheLocalContent(cid, fileBuffer, mimeType);

  return {
    cid,
    gatewayUrl: `/api/ipfs/${cid}`,
    provider: 'local-cas',
  };
};

export const getCachedContent = (cid) => {
  ensureStorageDir();
  const filePath = path.join(config.paths.ipfsStorage, cid);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const metaPath = path.join(config.paths.ipfsStorage, `${cid}.meta.json`);
  let mimeType = 'application/octet-stream';
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      mimeType = meta.mimeType || mimeType;
    } catch (e) {
      // ignore
    }
  }

  const buffer = fs.readFileSync(filePath);
  return { buffer, mimeType };
};

export default {
  computeCIDv1,
  pinJSONToIPFS,
  pinFileToIPFS,
  getCachedContent,
};
