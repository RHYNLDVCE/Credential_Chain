import React, { useState } from 'react';
import { Lock, LogIn, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from '../MetaMaskFoxIcon';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { loginWithMetaMask, isLoggingIn } = useMetaMask();
  const [email, setEmail] = useState('registrar@msu.edu.ph');
  const [password, setPassword] = useState('registrar123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleMetaMaskLogin = async () => {
    setError('');
    try {
      const res = await loginWithMetaMask();
      onLoginSuccess(res.token, res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'MetaMask sign-in failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Authentication failed');
      }

      onLoginSuccess(data.data.token, data.data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={18} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Staff Authentication</h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                MSU-TCTO Registrar Intranet Portal
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleMetaMaskLogin}
          disabled={isSubmitting || isLoggingIn}
          className="btn btn-secondary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '10px',
            fontWeight: 600,
            fontSize: '0.84rem',
            marginBottom: '0.75rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
        >
          <MetaMaskFoxIcon size={18} />
          <span>{isLoggingIn ? 'Verifying MetaMask...' : 'Connect & Sign In with MetaMask'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0.75rem 0 1rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              Institutional Email
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. registrar@msu.edu.ph"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              Access Password
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginTop: '0.5rem', display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Authenticate Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
