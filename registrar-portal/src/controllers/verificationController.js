import { successResponse, errorResponse } from '../lib/utils/response.js';
import verificationService from '../lib/services/verificationService.js';
import credentialService from '../lib/services/credentialService.js';
import { getCredentialByDocHash } from '../lib/services/dbService.js';
import { computeSHA256 } from '../lib/services/canonicalizer.js';

export const VerificationController = {
  async verifyById(tokenId) {
    try {
      const cred = await credentialService.getCredentialDetails(tokenId);
      return successResponse(cred, 'Credential status retrieved');
    } catch (err) {
      return errorResponse(err.message || 'Verification lookup failed', 500);
    }
  },

  async verifyToken(request) {
    try {
      const body = await request.json();
      const { tokenId, docHash, claimedStudent } = body;

      if (!tokenId || !docHash || !claimedStudent) {
        return errorResponse('tokenId, docHash, and claimedStudent are all required', 400);
      }

      const result = await verificationService.verifyByTokenId({
        tokenId,
        docHash,
        claimedStudent,
      });

      return successResponse(result, `Credential Verified: ${result.statusLabel || result.status}`);
    } catch (err) {
      return errorResponse(err.message || 'Verification failed', 500);
    }
  },

  async verifyHash(request) {
    try {
      const body = await request.json();
      const { docHash, claimedStudent } = body;

      if (!docHash) {
        return errorResponse('docHash is required', 400);
      }

      const result = await verificationService.verifyByHash({ docHash, claimedStudent });
      return successResponse(result, result.found ? 'Hash lookup completed' : 'Hash not recognized');
    } catch (err) {
      return errorResponse(err.message || 'Failed to verify hash', 500);
    }
  },

  async verifyDocument(request) {
    try {
      const formData = await request.formData();
      const file = formData.get('document') || formData.get('file');

      if (!file) {
        return errorResponse('No document uploaded. Provide "document" or "file" field.', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const computedHash = computeSHA256(buffer);

      let match = await getCredentialByDocHash(computedHash);
      let targetTokenId = match ? match.tokenId : null;

      if (!targetTokenId) {
        try {
          const { getReadOnlyContract } = await import('../lib/blockchain/contract.js');
          const readContract = getReadOnlyContract();
          const onChainTokenId = await readContract.getTokenIdByDocHash(computedHash);
          if (onChainTokenId && onChainTokenId > 0n) {
            targetTokenId = onChainTokenId.toString();
          }
        } catch (e) {
          // ignore on-chain fallback error
        }
      }

      if (!targetTokenId) {
        return successResponse(
          {
            found: false,
            isValid: false,
            status: 'UNREGISTERED_DOCUMENT',
            statusLabel: 'Document Not Registered',
            statusDescription: 'The cryptographic fingerprint of this document does not match any record in the registry.',
            checks: {
              hashMatches: false,
              isActive: false,
            },
            diagnostics: { computedHash, fileName: file.name, fileSize: buffer.length },
          },
          'Verification completed: Document not recognized'
        );
      }

      // Check on-chain
      const onChain = await credentialService.getCredentialDetails(targetTokenId.toString());
      const isRevoked = onChain?.onChain?.isRevoked || (match && match.status === 'REVOKED');
      const isLocked = onChain?.onChain?.isLocked !== false;
      const owner = onChain?.owner || match?.studentAddress;
      const onChainHash = onChain?.onChain?.docHash || match?.docHash;
      const ipfsCID = onChain?.onChain?.ipfsCID || match?.ipfsCID;

      return successResponse(
        {
          found: true,
          isValid: !isRevoked,
          status: isRevoked ? 'REVOKED' : 'VALID',
          statusLabel: isRevoked ? 'Document Revoked' : 'Authentic Document Match',
          statusDescription: isRevoked
            ? 'This document is authentic but has been officially revoked by the university.'
            : 'Cryptographic document hash matches an active academic credential on the blockchain.',
          checks: {
            hashMatches: true,
            isActive: !isRevoked,
            ownerMatches: true,
            isSoulboundLocked: isLocked,
          },
          diagnostics: {
            tokenId: targetTokenId.toString(),
            actualOwner: owner,
            onChainHash,
            documentFileHash: computedHash,
            ipfsCID,
            fileName: file.name,
            fileSize: buffer.length,
            isRevoked,
            isSoulbound: isLocked,
            isLocked,
          },
          metadata: match?.canonicalRecord || onChain?.local?.canonicalRecord,
          academic: match?.canonicalRecord || onChain?.local?.canonicalRecord,
          studentAddress: owner,
          docHash: onChainHash,
          tokenId: targetTokenId.toString(),
          ipfsCID,
          isRevoked,
        },
        'Document verification completed'
      );
    } catch (err) {
      return errorResponse(err.message || 'Failed to verify document', 500);
    }
  },
};

export default VerificationController;
