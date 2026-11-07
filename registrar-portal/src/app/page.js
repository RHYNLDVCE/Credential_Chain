'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowRight,
  QrCode,
  FileCheck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function PublicInstitutionalGateway() {
  const router = useRouter();
  const [quickTokenId, setQuickTokenId] = useState('');
  const [tokenError, setTokenError] = useState('');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const trimmed = quickTokenId.trim();
    if (!trimmed) {
      setTokenError('Please enter a credential token number to verify.');
      return;
    }
    if (isNaN(trimmed) || parseInt(trimmed, 10) <= 0) {
      setTokenError('Please enter a valid positive token number (e.g. 1, 2, 42).');
      return;
    }
    setTokenError('');
    router.push(`/verify/${trimmed}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              MSU-TCTO Registrar Portal
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Mindanao State University — Tawi-Tawi College of Technology and Oceanography
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <Link
              href="/verify"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Verify Credential
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Hero */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Academic Credential Verification System
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Verify MSU-TCTO Academic Credentials
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: 1.7, marginBottom: '2rem' }}>
            Instantly verify degree authenticity for graduates of Mindanao State University — Tawi-Tawi College of Technology and Oceanography. 
            Credentials are recorded on an immutable blockchain registry.
          </p>

          {/* Quick Search */}
          <div style={{ maxWidth: '480px' }}>
            <form
              onSubmit={handleQuickSearch}
              noValidate
              style={{
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <input
                id="quick-token-input"
                type="number"
                min="1"
                placeholder="Enter credential token number (e.g. 1)"
                value={quickTokenId}
                onChange={(e) => {
                  setQuickTokenId(e.target.value);
                  if (tokenError) setTokenError('');
                }}
                className={`input-field ${tokenError ? 'input-error' : ''}`}
                style={{ flex: 1 }}
                aria-invalid={!!tokenError}
                aria-describedby={tokenError ? 'quick-token-feedback' : undefined}
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                Verify
              </button>
            </form>
            {tokenError && (
              <div
                id="quick-token-feedback"
                role="alert"
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--status-err-text)',
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{tokenError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Unified Verification Portal Card */}
        <div
          className="panel"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            marginBottom: '3rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1.5rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <p
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                Public Verification Portal
              </p>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginBottom: '0.65rem',
                  color: 'var(--text-primary)',
                }}
              >
                Official Credential Verification Methods
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Verify MSU-TCTO academic degrees and diplomas directly against the immutable blockchain registry.
                The verification portal supports multiple validation methods depending on what documentation you have available.
              </p>
            </div>

            <div style={{ alignSelf: 'center' }}>
              <Link
                href="/verify"
                className="btn btn-primary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <span>Open Verification Portal</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Verification Methods Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <QrCode size={16} color="var(--text-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  By Token ID or QR Code
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Checks live on-chain Soulbound Token status, confirms ownership, and verifies the credential is not revoked.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <FileCheck size={16} color="var(--text-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  By Document File
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Generates a SHA-256 fingerprint client-side without storing your file, detecting any digital tampering.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={16} color="var(--text-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Cryptographic Hash
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Directly cross-references hexadecimal hashes against the Ethereum Layer-2 smart contract and IPFS.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
          padding: '1.5rem',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Non-Transferable Credential</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanently bound to the graduate's identity</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Decentralized Storage</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credential metadata stored on IPFS</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Cryptographic Verification</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mathematical proof, no manual lookup needed</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        <p style={{ margin: '0 0 4px' }}>
          Mindanao State University — Tawi-Tawi College of Technology and Oceanography
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem' }}>
          Official Academic Credential Verification System
        </p>
      </footer>
    </div>
  );
}
