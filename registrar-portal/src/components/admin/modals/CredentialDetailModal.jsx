import React, { useState } from 'react';

export default function CredentialDetailModal({ credential, onClose }) {
  const [copiedKey, setCopiedKey] = useState('');

  if (!credential) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const rec = credential.canonicalRecord || {};
  const isRevoked = credential.status === 'REVOKED' || credential.isRevoked;
  const recoveryHistory = credential.recoveryHistory || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Credential #{credential.tokenId}
              </h2>
              <span className={`badge ${isRevoked ? 'badge-revoked' : 'badge-active'}`}>
                {isRevoked ? 'Revoked' : 'Active'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              MSU-TCTO Academic Credential Record
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Revocation Notice */}
          {isRevoked && credential.revocation && (
            <div className="alert alert-error">
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>This credential has been revoked</div>
              <div style={{ fontSize: '0.82rem' }}>
                Reason: {credential.revocation.reason || 'No reason provided'}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8 }}>
                Revoked by: {credential.revocation.revokedBy}
              </div>
            </div>
          )}

          {/* Academic Details */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Academic Record
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: '0.85rem' }}>
              {[
                { label: 'Document Type', value: rec.credentialType || 'Diploma' },
                { label: 'Graduate Name', value: rec.studentName || '—' },
                { label: 'Student ID', value: rec.studentId || '—', mono: true },
                { label: 'College', value: rec.college || 'MSU-TCTO' },
                { label: 'Department', value: rec.department || 'Academic Division' },
                { label: 'Degree Program', value: rec.degreeTitle || '—' },
                { label: 'Major / Track', value: rec.major || 'General' },
                { label: 'Honors', value: rec.honors || 'None' },
                { label: 'Graduation Date', value: rec.graduationDate || '—' },
                ...(rec.gpa ? [{ label: 'GPA', value: rec.gpa }] : []),
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                  <div style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: mono ? 'var(--font-mono)' : undefined,
                    fontSize: mono ? '0.82rem' : undefined,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="divider" style={{ margin: 0 }} />

          {/* Cryptographic Hashes */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Blockchain and Cryptographic Data
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Wallet Address', value: credential.studentAddress, key: 'student' },
                { label: 'SHA-256 Document Hash', value: credential.docHash, key: 'hash' },
                credential.ipfsCID ? { label: 'IPFS Content ID', value: credential.ipfsCID, key: 'ipfs' } : null,
              ].filter(Boolean).map(({ label, value, key }) => (
                <div
                  key={key}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                      {value}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(value, key)}
                    style={{ flexShrink: 0 }}
                  >
                    {copiedKey === key ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery History */}
          {recoveryHistory.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Key Recovery History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recoveryHistory.map((recov, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {recov.reason}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                      {recov.previousAddress} to {recov.newAddress}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
