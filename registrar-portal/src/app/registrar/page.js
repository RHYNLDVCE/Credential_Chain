'use client';

import React, { useState, useEffect } from 'react';

import AdminHeader from '@/components/admin/AdminHeader';
import ThemeToggle from '@/components/ThemeToggle';
import AdminNavigation from '@/components/admin/AdminNavigation';
import MetricsOverview from '@/components/admin/MetricsOverview';
import SingleIssuanceTab from '@/components/admin/SingleIssuanceTab';
import BatchCohortTab from '@/components/admin/BatchCohortTab';
import CredentialRegistryTab from '@/components/admin/CredentialRegistryTab';
import AuditTrailTab from '@/components/admin/AuditTrailTab';

import CredentialDetailModal from '@/components/admin/modals/CredentialDetailModal';
import RevokeModal from '@/components/admin/modals/RevokeModal';
import RecoverModal from '@/components/admin/modals/RecoverModal';
import QrCodeModal from '@/components/admin/modals/QrCodeModal';
import MetaMaskModal from '@/components/admin/modals/MetaMaskModal';
import MetaMaskFoxIcon from '@/components/admin/MetaMaskFoxIcon';
import { MetaMaskProvider, useMetaMask } from '@/lib/context/MetaMaskContext';

export default function RegistrarPortal() {
  return (
    <MetaMaskProvider>
      <RegistrarPortalInner />
    </MetaMaskProvider>
  );
}

function RegistrarPortalInner() {
  const { isInstalled, isLoggingIn, loginWithMetaMask, disconnect: disconnectMetaMask } = useMetaMask();
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');

  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  const [credentials, setCredentials] = useState([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  const [selectedCred, setSelectedCred] = useState(null);
  const [revokeCred, setRevokeCred] = useState(null);
  const [recoverCred, setRecoverCred] = useState(null);
  const [qrModalData, setQrModalData] = useState(null);

  // Theme persistence
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('msu_registrar_token');
    const savedUser = localStorage.getItem('msu_registrar_user');

    if (savedToken && savedUser) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${savedToken}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setToken(savedToken);
            setUser(data.data);
          } else {
            localStorage.removeItem('msu_registrar_token');
            localStorage.removeItem('msu_registrar_user');
          }
        })
        .catch(() => {
          localStorage.removeItem('msu_registrar_token');
          localStorage.removeItem('msu_registrar_user');
        })
        .finally(() => setIsCheckingSession(false));
    } else {
      setIsCheckingSession(false);
    }
  }, []);

  const refreshSystemData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/stats'),
      ]);
      const [healthData, statsData] = await Promise.all([
        healthRes.json(),
        statsRes.json(),
      ]);
      setHealth(healthData);
      if (statsData.success) setStats(statsData.data);
    } catch (err) {
      console.error('Failed to load system data:', err);
    }
  };

  const fetchCredentials = async () => {
    if (!token) return;
    setIsLoadingCredentials(true);
    try {
      const res = await fetch('/api/credentials?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCredentials(data.data.credentials || []);
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshSystemData();
      fetchCredentials();
    }
  }, [token]);

  const handleGateLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Both email and password are required.');
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Invalid credentials');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('msu_registrar_token', data.data.token);
      localStorage.setItem('msu_registrar_user', JSON.stringify(data.data.user));
    } catch (err) {
      setLoginError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleMetaMaskGateLogin = async () => {
    setIsSubmittingLogin(true);
    setLoginError('');
    try {
      const res = await loginWithMetaMask();
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      setLoginError(err.message || 'MetaMask sign-in failed.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('msu_registrar_token');
    localStorage.removeItem('msu_registrar_user');
    setCredentials([]);
    setLoginPassword('');
    if (disconnectMetaMask) {
      disconnectMetaMask();
    }
  };

  const handleOpenQr = async (cred) => {
    try {
      const res = await fetch(`/api/credentials/${cred.tokenId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setQrModalData({ tokenId: cred.tokenId, dataUrl: data.data.qrDataURL });
      }
    } catch (err) {
      console.error('Failed to load QR:', err);
    }
  };

  // 1. Session check
  if (isCheckingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Verifying session...</div>
        </div>
      </div>
    );
  }

  // 2. Login Gate
  if (!token || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          background: 'var(--bg-base)',
        }}
      >
        {/* Theme toggle */}
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 50 }}>
          <ThemeToggle />
        </div>

        <div
          className="panel"
          style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}
        >
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}>
              Restricted Access
            </p>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              MSU-TCTO Registrar Portal
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Authorized staff only. Connect your institutional MetaMask account or sign in with your email credentials.
            </p>
          </div>

          {/* Web3 MetaMask Fast Sign-in */}
          <button
            type="button"
            id="btn-gate-metamask-signin"
            onClick={handleMetaMaskGateLogin}
            disabled={isLoggingIn || isSubmittingLogin}
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '11px',
              fontWeight: 600,
              fontSize: '0.86rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              cursor: isLoggingIn ? 'wait' : 'pointer',
              marginBottom: '0.5rem',
            }}
          >
            <MetaMaskFoxIcon size={20} />
            <span>
              {isLoggingIn
                ? 'Verifying Signature...'
                : 'Connect & Sign in with MetaMask'}
            </span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0.85rem 0 1.1rem',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span>or sign in with credentials</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Login Form */}
          <form onSubmit={handleGateLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="registrar@msu.edu.ph"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div className="alert alert-error">{loginError}</div>
            )}

            <button
              type="submit"
              disabled={isSubmittingLogin || isLoggingIn}
              className="btn btn-primary"
              style={{ padding: '10px', marginTop: '4px' }}
            >
              {isSubmittingLogin ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            All access attempts are timestamped and recorded in the institutional audit trail.
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Dashboard
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader
        health={health}
        user={user}
        onOpenLogin={() => {}}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <AdminNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
        />

        {activeTab === 'dashboard' && (
          <MetricsOverview
            stats={stats}
            health={health}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'issue' && (
          <SingleIssuanceTab
            token={token}
            onIssuanceComplete={() => { refreshSystemData(); fetchCredentials(); }}
            onOpenLogin={() => {}}
          />
        )}

        {activeTab === 'cohort' && (
          <BatchCohortTab
            token={token}
            onIssuanceComplete={() => { refreshSystemData(); fetchCredentials(); }}
            onOpenLogin={() => {}}
          />
        )}

        {activeTab === 'registry' && (
          <CredentialRegistryTab
            credentials={credentials}
            isLoading={isLoadingCredentials}
            onRefresh={fetchCredentials}
            onSelectCredential={setSelectedCred}
            onOpenQr={handleOpenQr}
            onOpenRevoke={setRevokeCred}
            onOpenRecover={setRecoverCred}
          />
        )}

        {activeTab === 'verifier' && (
          <div style={{ padding: '2rem 0' }}>
            <div className="section-header">
              <h2>Public Verification Portal</h2>
              <p>
                The public verifier is available to anyone and does not require a staff login. 
                Share the link below with employers, embassies, or other institutions to verify credentials.
              </p>
            </div>
            <a
              href="/verify"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Open Public Verifier
            </a>
          </div>
        )}

        {activeTab === 'audit' && (
          <AuditTrailTab
            token={token}
            onOpenLogin={() => {}}
          />
        )}
      </main>

      <CredentialDetailModal
        credential={selectedCred}
        onClose={() => setSelectedCred(null)}
      />
      <RevokeModal
        credential={revokeCred}
        token={token}
        onClose={() => setRevokeCred(null)}
        onRevokeSuccess={() => { refreshSystemData(); fetchCredentials(); }}
      />
      <RecoverModal
        credential={recoverCred}
        token={token}
        onClose={() => setRecoverCred(null)}
        onRecoverSuccess={() => { refreshSystemData(); fetchCredentials(); }}
      />
      <QrCodeModal
        data={qrModalData}
        onClose={() => setQrModalData(null)}
      />
      <MetaMaskModal />
    </div>
  );
}
