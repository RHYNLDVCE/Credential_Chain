import React from 'react';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from './MetaMaskFoxIcon';

export default function MetricsOverview({ stats, health, onNavigateTab }) {
  const onChain = stats?.onChain || {};
  const registry = stats?.registry || {};
  const { account, balance, roles, setIsModalOpen, connect } = useMetaMask();

  const networkDisplay =
    health?.blockchain?.chainId === '11155111'
      ? 'Ethereum Sepolia (Chain ID: 11155111)'
      : health?.blockchain?.chainId === '31337'
      ? 'Anvil Localhost (Chain ID: 31337)'
      : `EVM Chain (Chain ID: ${health?.blockchain?.chainId || '—'})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 4 Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1px',
        background: 'var(--border)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem 1.5rem' }}>
          <div className="metric-label">Active Credentials</div>
          <div className="metric-value">{onChain.totalActive ?? '—'}</div>
          <div className="metric-sub">Currently locked and valid</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem 1.5rem' }}>
          <div className="metric-label">Revoked</div>
          <div className="metric-value" style={{ color: 'var(--status-err-text)' }}>
            {onChain.totalRevoked ?? '—'}
          </div>
          <div className="metric-sub">Invalidated on-chain</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem 1.5rem' }}>
          <div className="metric-label">Graduate Cohorts</div>
          <div className="metric-value">{registry.totalCohorts ?? '—'}</div>
          <div className="metric-sub">Imported CSV rosters</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem 1.5rem' }}>
          <div className="metric-label">Student Records</div>
          <div className="metric-value">{registry.totalRegistered ?? '—'}</div>
          <div className="metric-sub">Total indexed in registry</div>
        </div>
      </div>

      {/* Two Column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>

        {/* Blockchain Node Status */}
        <div className="panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Blockchain Node Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="kv-row">
              <span className="kv-key">Network</span>
              <span className="kv-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                {networkDisplay}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Block Height</span>
              <span className="kv-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                {health?.blockchain?.blockNumber ?? '—'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Registrar Balance</span>
              <span className="kv-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                {parseFloat(health?.blockchain?.registrarBalanceEth || '0').toFixed(4)} ETH
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Contract Address</span>
              <span className="kv-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                {health?.contract?.address ?? '—'}
              </span>
            </div>
            <div className="kv-row" style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '8px' }}>
              <span className="kv-key" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MetaMaskFoxIcon size={14} />
                <span>Admin MetaMask</span>
              </span>
              <span className="kv-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                {account ? (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: roles.isRegistrar || roles.isAdmin ? 'var(--status-ok-text)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                    title="Click to view details"
                  >
                    {account.slice(0, 6)}...{account.slice(-4)} ({roles.isAdmin ? 'Admin' : roles.isRegistrar ? 'Registrar' : 'Connected'})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={connect}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    Connect Wallet
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Honors Distribution */}
        <div className="panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Honors Distribution
          </h3>
          {registry.honorsDistribution && Object.keys(registry.honorsDistribution).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(registry.honorsDistribution).map(([honor, count]) => (
                <div key={honor}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{honor}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (count / (registry.totalRegistered || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              No credential records yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
