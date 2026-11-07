import React, { useState } from 'react';

export default function VerificationResultCard({ result }) {
  const [copiedKey, setCopiedKey] = useState('');

  if (!result) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const isSuccess = result.isValid;

  return (
    <div
      className="panel"
      style={{
        padding: '1.75rem',
        borderColor: isSuccess ? 'var(--status-ok-border)' : 'var(--status-err-border)',
      }}
    >
      {/* Result Header */}
      <div style={{
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: isSuccess ? 'var(--status-ok-text)' : 'var(--status-err-text)',
              marginBottom: '4px',
            }}>
              {isSuccess ? 'Verification Passed' : 'Verification Failed'}
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {result.statusLabel || (isSuccess ? 'Authentic Credential' : 'Invalid Credential')}
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {result.statusDescription}
            </p>
          </div>
          {result.latencyMs && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              Checked in {result.latencyMs}ms
            </div>
          )}
        </div>
      </div>

      {/* Check Stages */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1px',
        background: 'var(--border)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            label: 'Token Status',
            value: result.diagnostics?.isRevoked ? 'Revoked' : 'Active',
            ok: !result.diagnostics?.isRevoked,
          },
          {
            label: 'ERC-5192 Soulbound',
            value: result.diagnostics?.isSoulbound !== false ? 'Locked (SBT)' : 'Unlocked',
            ok: result.diagnostics?.isSoulbound !== false,
          },
          {
            label: 'Document Hash',
            value: result.checks?.hashMatches !== false ? 'Matches' : 'Mismatch',
            ok: result.checks?.hashMatches !== false,
          },
          {
            label: 'IPFS Storage',
            value: result.diagnostics?.ipfsCID ? 'Pinned' : 'Not Available',
            ok: !!result.diagnostics?.ipfsCID,
          },
          {
            label: 'Issuing Authority',
            value: 'MSU-TCTO',
            ok: true,
          },
        ].map(({ label, value, ok }) => (
          <div
            key={label}
            style={{ background: 'var(--bg-surface)', padding: '1rem' }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: ok ? 'var(--status-ok-text)' : 'var(--status-err-text)',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Academic Details */}
      {result.metadata && (
        <div className="panel-elevated" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-primary)' }}>
            Degree Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            {[
              { label: 'Document Classification', value: result.metadata.credentialType || 'Diploma' },
              { label: 'Graduate Name', value: result.metadata.studentName },
              { label: 'Student ID', value: result.metadata.studentId, mono: true },
              { label: 'College', value: result.metadata.college || 'MSU-TCTO' },
              { label: 'Department', value: result.metadata.department || 'Academic Division' },
              { label: 'Degree Program', value: result.metadata.degreeTitle },
              { label: 'Major / Specialization', value: result.metadata.major || 'General' },
              { label: 'Honors', value: result.metadata.honors || 'None' },
              { label: 'Graduation Date', value: result.metadata.graduationDate },
              ...(result.metadata.gpa ? [{ label: 'GPA', value: result.metadata.gpa }] : []),
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
      )}

      {/* Cryptographic Proof */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { label: 'Graduate Wallet Address', value: result.diagnostics?.actualOwner, key: 'owner' },
          { label: 'On-Chain Document Hash (SHA-256)', value: result.diagnostics?.onChainHash, key: 'hash' },
          { label: 'Uploaded Document Hash (SHA-256)', value: result.diagnostics?.documentFileHash, key: 'fileHash' },
          { label: 'IPFS Content ID', value: result.diagnostics?.ipfsCID, key: 'ipfs', isLink: true },
        ].map(({ label, value, key, isLink }) => {
          if (!value) return null;
          return (
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {value}
                </div>
              </div>
              {isLink ? (
                <a
                  href={`/api/ipfs/${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  Open
                </a>
              ) : (
                <button
                  onClick={() => copyToClipboard(value, key)}
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  {copiedKey === key ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
