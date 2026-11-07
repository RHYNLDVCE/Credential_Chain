import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import MetaMaskButton from '@/components/admin/MetaMaskButton';

export default function AdminHeader({ health, user, onOpenLogin, onLogout }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* Brand */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            MSU-TCTO Registrar Portal
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Mindanao State University — Tawi-Tawi College of Technology and Oceanography
          </div>
        </div>

        {/* Blockchain Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78rem',
          }}
        >
          <span className={`status-dot ${health?.blockchain?.connected ? '' : 'status-dot-err'}`} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {health?.blockchain?.connected
              ? `Chain ${health.blockchain.chainId}`
              : 'Connecting...'}
          </span>
          {health?.blockchain?.blockNumber && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                borderLeft: '1px solid var(--border)',
                paddingLeft: '8px',
              }}
            >
              Block {health.blockchain.blockNumber}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MetaMaskButton />
          <ThemeToggle />
          <Link
            href="/verify"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            Public Verifier
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user.role}
                </div>
              </div>
              <button
                id="btn-logout"
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                title="Sign out of session"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              id="btn-open-login"
              className="btn btn-primary btn-sm"
              onClick={onOpenLogin}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
