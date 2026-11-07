'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from '../MetaMaskFoxIcon';

export default function MetaMaskModal() {
  const {
    account,
    balance,
    networkName,
    chainId,
    isCorrectNetwork,
    roles,
    contractAddress,
    isModalOpen,
    setIsModalOpen,
    disconnect,
    switchNetwork,
    refreshAccountDetails,
    connect,
  } = useMetaMask();

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isModalOpen || !account) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccountDetails(account);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        console.warn('Switch account cancelled:', err);
      }
    }
  };

  const etherscanUrl = `https://sepolia.etherscan.io/address/${account}`;
  const contractEtherscanUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;

  return (
    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '100%', padding: 0 }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MetaMaskFoxIcon size={24} />
            <div>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                MetaMask Account
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Web3 Institutional Identity
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsModalOpen(false)}
            style={{ padding: '4px 8px' }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Wrong Network Warning */}
          {!isCorrectNetwork && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-warn-bg)',
                border: '1px solid var(--status-warn-border)',
                color: 'var(--status-warn-text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span>Wrong Network Detected ({networkName})</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.4, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                The MSU-TCTO Soulbound Token registry is deployed on Ethereum Sepolia Testnet. Please switch networks to ensure valid on-chain authorizations.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={switchNetwork}
                style={{ alignSelf: 'flex-start', marginTop: '4px' }}
              >
                Switch to Ethereum Sepolia
              </button>
            </div>
          )}

          {/* Account & Balance Box */}
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Connected Wallet Address
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Copy address"
                >
                  {copied ? <Check size={12} color="var(--status-ok-text)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  title="View on Etherscan"
                >
                  <ExternalLink size={12} />
                  <span>Explorer</span>
                </a>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.86rem',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
                background: 'var(--bg-surface)',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              {account}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Balance: </span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {balance !== null ? `${balance} ETH` : 'Loading...'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                title="Refresh balance and permissions"
              >
                <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* Network Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Network</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <span className={`status-dot ${isCorrectNetwork ? '' : 'status-dot-err'}`} />
                <span>{networkName}</span>
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Chain ID</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {chainId ? (typeof chainId === 'string' && chainId.startsWith('0x') ? parseInt(chainId, 16) : chainId) : '—'}
              </div>
            </div>
          </div>

          {/* On-Chain Permissions */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                On-Chain SBT Contract Access
              </span>
              <a
                href={contractEtherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <span>Contract</span>
                <ExternalLink size={10} />
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Registrar Role */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>REGISTRAR_ROLE</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Authorized to issue, revoke, & recover SBTs</div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: roles.isRegistrar ? 'var(--status-ok-bg)' : 'var(--bg-elevated)',
                    border: `1px solid ${roles.isRegistrar ? 'var(--status-ok-border)' : 'var(--border)'}`,
                    color: roles.isRegistrar ? 'var(--status-ok-text)' : 'var(--text-muted)',
                  }}
                >
                  {roles.isRegistrar ? '✓ Authorized' : 'Not Granted'}
                </span>
              </div>

              {/* Admin Role */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>DEFAULT_ADMIN_ROLE</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Institutional contract governance</div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: roles.isAdmin ? 'var(--status-info-bg)' : 'var(--bg-elevated)',
                    border: `1px solid ${roles.isAdmin ? 'var(--status-info-border)' : 'var(--border)'}`,
                    color: roles.isAdmin ? 'var(--status-info-text)' : 'var(--text-muted)',
                  }}
                >
                  {roles.isAdmin ? '✓ Authorized' : 'Not Granted'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSwitchAccount}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Sliders size={14} />
              <span>Switch Account</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={disconnect}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '0.8rem',
                color: 'var(--status-err-text)',
                borderColor: 'var(--status-err-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
