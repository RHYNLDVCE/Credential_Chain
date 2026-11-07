import React, { useState, useEffect } from 'react';

export default function AuditTrailTab({ token, onOpenLogin }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    if (!token) { onOpenLogin(); return; }
    setIsLoading(true);
    try {
      const url = actionFilter
        ? `/api/system/audit-logs?action=${encodeURIComponent(actionFilter)}`
        : '/api/system/audit-logs';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.logs || []);
        setLogs(list);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLogs();
  }, [token, actionFilter]);

  const getActionBadgeClass = (action = '') => {
    if (action.includes('REVOKE')) return 'badge-revoked';
    if (action.includes('RECOVER')) return 'badge-warning';
    if (action.includes('ISSUE') || action.includes('MINT')) return 'badge-active';
    return 'badge-info';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div className="section-header" style={{ margin: 0 }}>
          <h2>Audit Trail</h2>
          <p>
            A tamper-evident log of all credential operations — issuance, revocation, key recovery, and administrative events.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="btn btn-secondary btn-sm"
          style={{ flexShrink: 0 }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Target Token</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {isLoading ? 'Loading audit trail...' : 'No audit records found.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt || log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {log.performedBy || log.actor || 'SYSTEM'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {log.targetTokenId ? `#${log.targetTokenId}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details
                      ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details)
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
