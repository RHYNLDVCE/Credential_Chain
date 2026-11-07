import React, { useState } from 'react';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from '../MetaMaskFoxIcon';

export default function RecoverModal({ credential, token, onClose, onRecoverSuccess }) {
  const { account, roles } = useMetaMask();
  const [newAddress, setNewAddress] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!credential) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
      setError('Please enter a valid Ethereum address (42 characters, starting with 0x).');
      return;
    }
    if (!reason.trim()) {
      setError('A recovery reason or affidavit reference is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/credentials/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenId: credential.tokenId,
          newStudentAddress: newAddress.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Key recovery failed');

      onRecoverSuccess(credential.tokenId, newAddress.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Key recovery failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Wallet Key Recovery
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Token #{credential.tokenId} — {credential.canonicalRecord?.studentName || 'Graduate'}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="alert alert-warning">
            Used when a graduate loses access to their wallet. This process burns the existing credential 
            and re-mints it to the graduate's new verified address. Both operations are recorded on the blockchain.
          </div>

          {account && (
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <MetaMaskFoxIcon size={14} />
              <span>
                Connected Signer: <strong style={{ fontFamily: 'var(--font-mono)' }}>{account.slice(0, 6)}...{account.slice(-4)}</strong>{' '}
                {roles.isRegistrar ? '(Authorized Registrar ✓)' : ''}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Current Wallet Address (read-only)</label>
              <input
                type="text"
                disabled
                value={credential.studentAddress}
                className="input-field"
                style={{ opacity: 0.55, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" htmlFor="recover-new-address" style={{ margin: 0 }}>
                  New Verified Wallet Address *
                </label>
                {account && (
                  <button
                    type="button"
                    onClick={() => setNewAddress(account)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                    title="Paste connected MetaMask address"
                  >
                    <MetaMaskFoxIcon size={12} />
                    <span>Use My Wallet ({account.slice(0, 6)}...{account.slice(-4)})</span>
                  </button>
                )}
              </div>
              <input
                id="recover-new-address"
                type="text"
                className="input-field"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x..."
                required
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="recover-reason">
                Affidavit or Recovery Reference *
              </label>
              <textarea
                id="recover-reason"
                rows={2}
                className="input-field"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Identity verified in person with notarized loss affidavit #2026-88"
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newAddress.trim() || !reason.trim()}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {isSubmitting ? 'Processing...' : 'Execute Key Recovery'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
