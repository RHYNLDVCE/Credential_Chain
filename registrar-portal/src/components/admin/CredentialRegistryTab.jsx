import React, { useState } from 'react';

export default function CredentialRegistryTab({
  credentials,
  isLoading,
  onRefresh,
  onSelectCredential,
  onOpenQr,
  onOpenRevoke,
  onOpenRecover,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = credentials.filter((cred) => {
    const rec = cred.canonicalRecord || {};
    const matchesSearch =
      !search ||
      cred.tokenId?.toString().includes(search) ||
      cred.studentAddress?.toLowerCase().includes(search.toLowerCase()) ||
      rec.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      rec.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      rec.credentialType?.toLowerCase().includes(search.toLowerCase()) ||
      rec.college?.toLowerCase().includes(search.toLowerCase()) ||
      rec.department?.toLowerCase().includes(search.toLowerCase()) ||
      rec.degreeTitle?.toLowerCase().includes(search.toLowerCase());

    const isRevoked = cred.status === 'REVOKED' || cred.isRevoked;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !isRevoked) ||
      (statusFilter === 'REVOKED' && isRevoked);

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, student ID, token, type, or wallet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px', flexShrink: 0 }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn btn-secondary btn-sm"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Table */}
      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Document Type</th>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Degree</th>
              <th>Honors</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {isLoading ? 'Loading credentials...' : 'No credentials found.'}
                </td>
              </tr>
            ) : (
              filtered.map((cred) => {
                const rec = cred.canonicalRecord || {};
                const isRevoked = cred.status === 'REVOKED' || cred.isRevoked;

                return (
                  <tr key={cred.tokenId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{cred.tokenId}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>
                        {rec.credentialType || 'Diploma'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{rec.studentName || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {rec.studentId || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.degreeTitle || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {[rec.college, rec.department].filter(Boolean).join(' • ') || 'MSU-TCTO'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {rec.honors || 'None'}
                    </td>
                    <td>
                      <span className={`badge ${isRevoked ? 'badge-revoked' : 'badge-active'}`}>
                        {isRevoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '5px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectCredential(cred)}
                          title="View details"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenQr(cred)}
                          title="Generate QR code"
                        >
                          QR
                        </button>
                        {!isRevoked && (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => onOpenRevoke(cred)}
                              title="Revoke this credential"
                            >
                              Revoke
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpenRecover(cred)}
                              title="Key recovery"
                            >
                              Recover
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
