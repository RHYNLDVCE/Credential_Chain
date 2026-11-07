import { successResponse, errorResponse } from '../lib/utils/response.js';
import { getBlockchainStatus } from '../lib/blockchain/provider.js';
import { getReadOnlyContract, verifyContractConnection } from '../lib/blockchain/contract.js';
import { getRegistryStats, listAuditLogs } from '../lib/services/dbService.js';
import config from '../lib/config.js';

export const SystemController = {
  async getHealth() {
    try {
      const [blockchainStats, contractStats] = await Promise.all([
        getBlockchainStatus(),
        verifyContractConnection(),
      ]);

      const isHealthy = blockchainStats.connected && contractStats.connected;

      return Response.json({
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        institution: {
          id: config.institutionId,
          name: config.institutionName,
          department: config.departmentName,
        },
        blockchain: blockchainStats,
        contract: contractStats,
      });
    } catch (err) {
      return Response.json(
        {
          status: 'UNHEALTHY',
          timestamp: new Date().toISOString(),
          error: err.message,
        },
        { status: 503 }
      );
    }
  },

  async getStats() {
    try {
      const contract = getReadOnlyContract();
      const [totalIssued, totalRevoked, totalActive] = await Promise.all([
        contract.totalCredentialsIssued(),
        contract.totalCredentialsRevoked(),
        contract.totalActiveCredentials(),
      ]);

      const registry = await getRegistryStats();

      return successResponse(
        {
          onChain: {
            totalIssued: totalIssued.toString(),
            totalRevoked: totalRevoked.toString(),
            totalActive: totalActive.toString(),
          },
          registry,
        },
        'System statistics retrieved'
      );
    } catch (err) {
      return errorResponse(err.message || 'Failed to fetch statistics', 500);
    }
  },

  async getAuditLogs(request) {
    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action') || null;
      const tokenId = searchParams.get('tokenId') || null;
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      const logs = await listAuditLogs({ action, tokenId, limit });

      return successResponse(logs, 'Audit logs retrieved');
    } catch (err) {
      return errorResponse(err.message || 'Failed to fetch audit logs', 500);
    }
  },
};

export default SystemController;
