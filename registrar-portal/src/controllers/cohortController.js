import { successResponse, errorResponse } from '../lib/utils/response.js';
import credentialService from '../lib/services/credentialService.js';
import { canonicalizeJSON, computeSHA256 } from '../lib/services/canonicalizer.js';
import { listCohorts } from '../lib/services/dbService.js';

export const CohortController = {
  async list(request) {
    try {
      const cohorts = await listCohorts();
      return successResponse(cohorts, 'Cohorts retrieved successfully');
    } catch (err) {
      return errorResponse(err.message || 'Failed to list cohorts', 500);
    }
  },

  async preview(request) {
    try {
      const contentType = request.headers.get('content-type') || '';
      let fileContent = '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('roster') || formData.get('file');
        if (!file) {
          return errorResponse('No cohort file uploaded. Provide "roster" or "file" field.', 400);
        }
        fileContent = await file.text();
      } else {
        const body = await request.json();
        fileContent = body.content || '';
      }

      if (!fileContent.trim()) {
        return errorResponse('Cohort file is empty', 400);
      }

      // Parse CSV or JSON
      let parsedRows = [];
      const trimmed = fileContent.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const json = JSON.parse(trimmed);
        parsedRows = Array.isArray(json) ? json : [json];
      } else {
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          return errorResponse('CSV must contain a header line and at least one data record', 400);
        }
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          parsedRows.push(rowObj);
        }
      }

      // Validate & Canonicalize
      const validationResults = parsedRows.map((row, idx) => {
        const errors = [];
        if (!row.studentAddress || !/^0x[a-fA-F0-9]{40}$/.test(row.studentAddress)) {
          errors.push('Invalid or missing student Ethereum address');
        }
        if (!row.studentName) errors.push('Missing studentName');
        if (!row.studentId) errors.push('Missing studentId');
        if (!row.degreeTitle) errors.push('Missing degreeTitle');
        if (!row.graduationDate) errors.push('Missing graduationDate');

        let canonicalJson = null;
        let docHash = null;

        if (errors.length === 0) {
          try {
            canonicalJson = canonicalizeJSON({
              studentAddress: row.studentAddress,
              studentName: row.studentName,
              studentId: row.studentId,
              degreeTitle: row.degreeTitle,
              graduationDate: row.graduationDate,
              honors: row.honors || 'None',
              major: row.major || 'Information Technology',
            });
            docHash = computeSHA256(canonicalJson);
          } catch (e) {
            errors.push('Canonicalization error: ' + e.message);
          }
        }

        return {
          rowNumber: idx + 1,
          data: row,
          isValid: errors.length === 0,
          errors,
          docHash,
        };
      });

      const validCount = validationResults.filter((r) => r.isValid).length;
      return successResponse(
        {
          total: validationResults.length,
          validCount,
          invalidCount: validationResults.length - validCount,
          records: validationResults,
        },
        'Cohort parsed and validated successfully'
      );
    } catch (err) {
      return errorResponse(err.message || 'Failed to preview cohort roster', 500);
    }
  },

  async issue(request, user) {
    try {
      const body = await request.json();
      const { cohortName, credentials } = body;

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return errorResponse('credentials must be a non-empty array of records', 400);
      }

      const results = await credentialService.issueCohortBatch(
        credentials,
        cohortName || `Cohort-${Date.now()}`,
        user.email
      );

      return successResponse(results, 'Cohort batch issuance completed', 201);
    } catch (err) {
      return errorResponse(err.message || 'Failed to issue cohort batch', 500);
    }
  },
};

export default CohortController;
