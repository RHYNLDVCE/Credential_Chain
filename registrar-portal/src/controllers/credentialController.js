import { successResponse, errorResponse } from '../lib/utils/response.js';
import credentialService from '../lib/services/credentialService.js';
import qrService from '../lib/services/qrService.js';
import { queryCredentials, listAuditLogs } from '../lib/services/dbService.js';

export const CredentialController = {
  async list(request, user) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const degree = searchParams.get('degree') || '';
      const studentAddress = searchParams.get('student') || searchParams.get('studentAddress') || '';

      const result = await queryCredentials({
        search,
        status,
        degree,
        studentAddress,
        page,
        limit,
      });

      return successResponse(
        {
          credentials: result.items,
          pagination: result.pagination,
        },
        'Credentials retrieved successfully'
      );
    } catch (err) {
      return errorResponse(err.message || 'Failed to list credentials', 500);
    }
  },

  async issue(request, user) {
    try {
      const contentType = request.headers.get('content-type') || '';
      let payload = {};
      let fileBuffer = null;
      let fileName = null;
      let mimeType = 'application/pdf';

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            fileBuffer = Buffer.from(await value.arrayBuffer());
            fileName = value.name;
            mimeType = value.type || 'application/pdf';
          } else {
            payload[key] = value;
          }
        }
      } else {
        payload = await request.json();
      }

      const {
        studentAddress,
        studentName,
        studentId,
        degreeTitle,
        graduationDate,
        honors,
        major,
        college,
        department,
        gpa,
        credentialType = 'Diploma',
      } = payload;

      if (!studentAddress || !studentName || !studentId || !degreeTitle || !graduationDate) {
        return errorResponse(
          'Missing required fields: studentAddress, studentName, studentId, degreeTitle, graduationDate',
          400
        );
      }

      const receipt = await credentialService.issueSingleCredential({
        studentAddress,
        studentName,
        studentId,
        degreeTitle,
        graduationDate,
        honors,
        major,
        college,
        department,
        gpa,
        credentialType,
        file: fileBuffer
          ? {
              buffer: fileBuffer,
              originalname: fileName,
              mimetype: mimeType,
              size: fileBuffer.length,
            }
          : null,
        performedBy: user.email,
      });

      return successResponse(receipt, 'Credential minted successfully', 201);
    } catch (err) {
      return errorResponse(err.message || 'Failed to issue credential', 500);
    }
  },

  async batch(request, user) {
    try {
      const body = await request.json();
      const { credentials, cohortName } = body;

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return errorResponse('credentials must be a non-empty array', 400);
      }

      const results = await credentialService.issueBatchCredentials(
        credentials,
        cohortName || `Batch-${Date.now()}`,
        user.email
      );

      return successResponse(results, 'Batch issuance completed', 201);
    } catch (err) {
      return errorResponse(err.message || 'Failed to issue batch credentials', 500);
    }
  },

  async revoke(request, user) {
    try {
      const body = await request.json();
      const { tokenId, reason } = body;

      if (!tokenId || !reason) {
        return errorResponse('tokenId and reason are required', 400);
      }

      const receipt = await credentialService.revokeCredential(tokenId, reason, user.email);
      return successResponse(receipt, `Credential #${tokenId} revoked successfully`);
    } catch (err) {
      return errorResponse(err.message || 'Failed to revoke credential', 500);
    }
  },

  async recover(request, user) {
    try {
      const body = await request.json();
      const { tokenId, newStudentAddress, reason } = body;

      if (!tokenId || !newStudentAddress || !reason) {
        return errorResponse('tokenId, newStudentAddress, and reason are required', 400);
      }

      const receipt = await credentialService.recoverStudentKey(
        tokenId,
        newStudentAddress,
        reason,
        user.email
      );

      return successResponse(receipt, `Credential #${tokenId} successfully recovered`);
    } catch (err) {
      return errorResponse(err.message || 'Failed to recover credential', 500);
    }
  },

  async getById(tokenId) {
    try {
      const cred = await credentialService.getCredentialDetails(tokenId);
      return successResponse(cred, `Credential #${tokenId} retrieved`);
    } catch (err) {
      return errorResponse(err.message || 'Failed to fetch credential', 500);
    }
  },

  async getQr(tokenId, searchParams) {
    try {
      const format = searchParams.get('format') || 'dataurl';
      const cred = await credentialService.getCredentialDetails(tokenId);

      const qrPayload = qrService.generateVerificationPayload({
        tokenId: cred.tokenId,
        docHash: cred.onChain.docHash,
        studentAddress: cred.owner,
      });

      if (format === 'svg') {
        const svg = await qrService.generateQRCodeSVG(qrPayload);
        return new Response(svg, {
          headers: { 'Content-Type': 'image/svg+xml' },
        });
      }

      const qrDataURL = await qrService.generateQRCodeDataURL(qrPayload);
      return successResponse({ qrDataURL, payload: qrPayload }, 'QR code generated');
    } catch (err) {
      return errorResponse(err.message || 'Failed to generate QR code', 500);
    }
  },

  async getAudit(tokenId) {
    try {
      const logs = await listAuditLogs({ tokenId });
      return successResponse(logs, `Audit history for Token #${tokenId}`);
    } catch (err) {
      return errorResponse(err.message || 'Failed to fetch audit history', 500);
    }
  },
};

export default CredentialController;
