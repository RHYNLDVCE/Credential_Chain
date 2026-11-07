'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  GraduationCap,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ShieldAlert,
  FileText,
  Award,
} from 'lucide-react';

export default function TokenVerifyPage({ params }) {
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.tokenId;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  useEffect(() => {
    if (!tokenId) return;

    const fetchVerification = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/verify/${tokenId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || 'Failed to verify token');
        }

        const cred = data.data;
        if (!cred.existsOnChain) {
          setResult({
            isValid: false,
            statusLabel: 'Token Not Found',
            statusDescription: `Token #${tokenId} has not been issued on the MSU-TCTO ERC-5192 smart contract.`,
            diagnostics: { tokenId },
          });
        } else if (cred.onChain.isRevoked) {
          setResult({
            isValid: false,
            statusLabel: 'Credential Revoked',
            statusDescription: `This credential was officially revoked: "${cred.onChain.revocationReason || 'No reason provided'}"`,
            diagnostics: {
              tokenId,
              actualOwner: cred.owner,
              onChainHash: cred.onChain.docHash,
              ipfsCID: cred.onChain.ipfsCID,
              issuedAt: new Date(cred.onChain.issuedAt * 1000).toLocaleDateString(),
              isRevoked: true,
              revocationReason: cred.onChain.revocationReason,
            },
            metadata: cred.local?.canonicalRecord || cred.local?.academic || null,
          });
        } else {
          setResult({
            isValid: true,
            statusLabel: 'Officially Verified & Authentic',
            statusDescription: 'Token exists on the blockchain, is permanently locked (ERC-5192 Soulbound), and matches the registry.',
            diagnostics: {
              tokenId,
              actualOwner: cred.owner,
              onChainHash: cred.onChain.docHash,
              ipfsCID: cred.onChain.ipfsCID,
              issuedAt: new Date(cred.onChain.issuedAt * 1000).toLocaleDateString(),
              isRevoked: false,
            },
            metadata: cred.local?.canonicalRecord || cred.local?.academic || null,
          });
        }
      } catch (err) {
        setError(err.message || 'Verification failed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [tokenId]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(10, 15, 29, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/verify"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.82rem' }}
            >
              <ChevronLeft size={16} />
              <span>Back to Verifier</span>
            </Link>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                MSU-TCTO Credential #{tokenId}
              </span>
            </div>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <RefreshCw size={36} className="spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Querying On-Chain State...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Executing decentralized query on EVM Layer-2 ERC-5192 contract
            </p>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger)', margin: '0 0 0.5rem' }}>
              Verification Request Failed
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {error}
            </p>
            <Link href="/verify" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Try Another Verification
            </Link>
          </div>
        ) : result ? (
          <div
            className="card"
            style={{
              padding: '2.5rem',
              border: result.isValid ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              background: result.isValid
                ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%)'
                : 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            {/* Verification Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.75rem',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: result.isValid
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: result.isValid
                    ? '0 0 25px rgba(16, 185, 129, 0.4)'
                    : '0 0 25px rgba(239, 68, 68, 0.4)',
                }}
              >
                {result.isValid ? <CheckCircle2 size={32} color="#ffffff" /> : <ShieldAlert size={32} color="#ffffff" />}
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: result.isValid ? '#34d399' : '#f87171',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {result.statusLabel}
                </h1>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  {result.statusDescription}
                </p>
              </div>
            </div>

            {/* Academic Details */}
            {result.metadata && (
              <div
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <GraduationCap size={22} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Conferred Degree Record</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Document Classification</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {result.metadata.credentialType || 'Diploma'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Graduate Name</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {result.metadata.studentName}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Student ID Number</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {result.metadata.studentId}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>College</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {result.metadata.college || 'MSU-TCTO'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Department</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {result.metadata.department || 'Academic Division'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Degree Program</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {result.metadata.degreeTitle}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Major / Specialization</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {result.metadata.major || 'General'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Academic Honors</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fbbf24' }}>
                      {result.metadata.honors || 'None'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Graduation Date</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {result.metadata.graduationDate}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Cryptographic Proof Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>
                    Graduate Owner Ethereum Address (ERC-5192 Soulbound)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {result.diagnostics?.actualOwner}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.diagnostics?.actualOwner, 'owner')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {copiedKey === 'owner' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>
                    On-Chain Document Hash (SHA-256)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {result.diagnostics?.onChainHash}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.diagnostics?.onChainHash, 'hash')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {copiedKey === 'hash' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>

              {result.diagnostics?.ipfsCID && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>
                      IPFS Decentralized Metadata CID
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', wordBreak: 'break-all' }}>
                      {result.diagnostics?.ipfsCID}
                    </span>
                  </div>
                  <a
                    href={`/api/ipfs/${result.diagnostics?.ipfsCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
