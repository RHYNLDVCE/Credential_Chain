import QRCode from 'qrcode';
import config from '../config.js';

export const generateVerificationPayload = ({ tokenId, docHash, studentAddress }) => {
  const verifyUrl = `${config.verificationPortalUrl}?tokenId=${tokenId}&docHash=${docHash}&student=${studentAddress}`;

  return {
    v: 1,
    protocol: 'ERC-5192-SBT',
    tokenId: tokenId.toString(),
    docHash,
    student: studentAddress,
    contract: config.contractAddress,
    institution: config.institutionId,
    verifyUrl,
  };
};

export const generateQRCodeDataURL = async (payload) => {
  const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return await QRCode.toDataURL(dataString, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
    width: 320,
  });
};

export const generateQRCodeSVG = async (payload) => {
  const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return await QRCode.toString(dataString, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
  });
};

export default {
  generateVerificationPayload,
  generateQRCodeDataURL,
  generateQRCodeSVG,
};
