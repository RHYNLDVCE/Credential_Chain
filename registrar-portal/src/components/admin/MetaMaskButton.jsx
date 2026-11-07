'use client';

import React from 'react';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from './MetaMaskFoxIcon';
import { RefreshCw, ChevronDown } from 'lucide-react';

export default function MetaMaskButton() {
  const {
    account,
    isConnecting,
    isInstalled,
    isCorrectNetwork,
    roles,
    setIsModalOpen,
    connect,
  } = useMetaMask();

  if (!isInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          textDecoration: 'none',
        }}
        title="MetaMask not detected. Click to install extension."
      >
        <MetaMaskFoxIcon size={16} />
        <span>Install MetaMask</span>
      </a>
    );
  }

  if (!account) {
    return (
      <button
        type="button"
        id="btn-connect-metamask"
        onClick={connect}
        disabled={isConnecting}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '0.78rem',
          fontWeight: 600,
          border: '1px solid var(--border)',
        }}
        title="Connect your MetaMask wallet"
      >
        {isConnecting ? (
          <>
            <RefreshCw size={14} className="spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <MetaMaskFoxIcon size={16} />
            <span>Connect MetaMask</span>
          </>
        )}
      </button>
    );
  }

  const truncated = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
  const roleLabel = roles.isAdmin
    ? 'Admin'
    : roles.isRegistrar
    ? 'Registrar'
    : 'Wallet';

  return (
    <button
      type="button"
      id="btn-metamask-status"
      onClick={() => setIsModalOpen(true)}
      className="btn btn-secondary btn-sm"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.78rem',
        padding: '5px 10px',
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
      }}
      title="View MetaMask account details and permissions"
    >
      <span className={`status-dot ${isCorrectNetwork ? '' : 'status-dot-err'}`} />
      <MetaMaskFoxIcon size={16} />
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{truncated}</span>
      <span
        style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          padding: '1px 6px',
          borderRadius: 'var(--radius-sm)',
          background: roles.isRegistrar || roles.isAdmin ? 'var(--status-ok-bg)' : 'var(--bg-base)',
          border: `1px solid ${roles.isRegistrar || roles.isAdmin ? 'var(--status-ok-border)' : 'var(--border)'}`,
          color: roles.isRegistrar || roles.isAdmin ? 'var(--status-ok-text)' : 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {roleLabel}
      </span>
      <ChevronDown size={12} color="var(--text-muted)" />
    </button>
  );
}
