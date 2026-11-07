import React, { useState } from 'react';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from '../MetaMaskFoxIcon';

export default function RevokeModal({ credential, token, onClose, onRevokeSuccess }) {
  const { account, roles } = useMetaMask();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!credential) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A revocation reason is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/credentials/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tokenId: credential.tokenId, reason: reason.trim() }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Revocation failed');

      onRevokeSuccess(credential.tokenId);
      onClose();
    } catch (err) {
      setError(err.message || 'Revocation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Revoke Credential #{credential.tokenId}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              This action is permanent and recorded on the blockchain.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="alert alert-error">
            Revoking this credential is an irreversible on-chain action. The credential will be permanently 
            marked as invalid on the blockchain. This cannot be undone.
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
              <label className="form-label" htmlFor="revoke-reason">Revocation Reason *</label>
              <textarea
                id="revoke-reason"
                rows={3}
                className="input-field"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Administrative cancellation due to academic dishonesty — Board Resolution #2026-04"
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
                disabled={isSubmitting || !reason.trim()}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                {isSubmitting ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
