'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  TokenVerifyForm,
  DocumentVerifyForm,
  HashVerifyForm,
} from '@/components/verify/VerifyForms';
import VerificationResultCard from '@/components/verify/VerificationResultCard';
import ThemeToggle from '@/components/ThemeToggle';

function VerifyPortalContent() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState('token');

  const [tokenId, setTokenId] = useState('');
  const [docHash, setDocHash] = useState('');
  const [claimedStudent, setClaimedStudent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Theme persistence
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    const qTokenId = searchParams.get('tokenId');
    const qDocHash = searchParams.get('docHash');
    const qStudent = searchParams.get('student');

    if (qTokenId) {
      setTokenId(qTokenId);
      if (qDocHash) setDocHash(qDocHash);
      if (qStudent) setClaimedStudent(qStudent);

      handleVerifyByToken({
        tokenId: qTokenId,
        docHash: qDocHash || undefined,
        claimedStudent: qStudent || undefined,
      });
    }
  }, [searchParams]);

  const handleVerifyByToken = async (overrideParams = null) => {
    const targetTokenId = overrideParams?.tokenId ?? tokenId;
    const targetDocHash = overrideParams?.docHash ?? docHash;
    const targetStudent = overrideParams?.claimedStudent ?? claimedStudent;

    if (!targetTokenId) {
      setErrorMsg('Please enter a valid Token ID.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      if (targetDocHash && targetStudent) {
        const res = await fetch('/api/verify/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: targetTokenId,
            docHash: targetDocHash,
            claimedStudent: targetStudent,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Verification failed');
        setVerificationResult(data.data);
      } else {
        const res = await fetch(`/api/verify/${targetTokenId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Credential query failed');

        const cred = data.data;
        if (!cred.existsOnChain) {
          setVerificationResult({
            isValid: false,
            statusLabel: 'Not Found',
            statusDescription: 'This Token ID does not exist in the credential registry.',
            diagnostics: { tokenId: targetTokenId },
          });
        } else if (cred.onChain.isRevoked) {
          setVerificationResult({
            isValid: false,
            statusLabel: 'Credential Revoked',
            statusDescription: `This credential has been officially revoked: "${cred.onChain.revocationReason || 'No reason provided'}"`,
            diagnostics: {
              tokenId: targetTokenId,
              actualOwner: cred.owner,
              onChainHash: cred.onChain.docHash,
              ipfsCID: cred.onChain.ipfsCID,
              isRevoked: true,
            },
            metadata: cred.local?.canonicalRecord || cred.local?.academic || null,
          });
        } else {
          setVerificationResult({
            isValid: true,
            statusLabel: 'Authentic and Valid',
            statusDescription: 'This credential is confirmed active on the blockchain.',
            checks: { isActive: true, hashMatches: true, ownerMatches: true },
            diagnostics: {
              tokenId: targetTokenId,
              actualOwner: cred.owner,
              isSoulbound: cred.onChain.isSoulbound !== false,
              isLocked: cred.onChain.isLocked !== false,
              onChainHash: cred.onChain.docHash,
              ipfsCID: cred.onChain.ipfsCID,
              isRevoked: false,
            },
            metadata: cred.local?.canonicalRecord || cred.local?.academic || null,
          });
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyByDocument = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a credential document (PDF or image).');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      const res = await fetch('/api/verify/document', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Document verification failed');
      setVerificationResult(data.data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to verify uploaded document.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyByHash = async () => {
    if (!docHash.trim()) {
      setErrorMsg('Please enter a valid SHA-256 hash (64 hexadecimal characters).');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const res = await fetch('/api/verify/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Hash lookup failed');

      setVerificationResult(data.data);
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              MSU-TCTO Credential Verifier
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Mindanao State University — Tawi-Tawi College of Technology and Oceanography
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <Link href="/" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: '860px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Hero */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Official Academic Credential Verification
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Verify a Degree Certificate
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '580px', lineHeight: 1.65, margin: 0 }}>
            Use this tool to confirm whether an MSU-TCTO degree credential is authentic and has not been revoked. 
            You can verify by token number, document file, or document hash.
          </p>
        </div>

        {/* Verification Panel */}
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          {/* Tab Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.5rem' }}>
            {[
              { id: 'token', label: 'By Token ID' },
              { id: 'document', label: 'By Document File' },
              { id: 'hash', label: 'By Document Hash' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setErrorMsg(''); setVerificationResult(null); }}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                style={{ padding: '12px 16px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'token' && (
              <TokenVerifyForm
                tokenId={tokenId}
                setTokenId={setTokenId}
                docHash={docHash}
                setDocHash={setDocHash}
                claimedStudent={claimedStudent}
                setClaimedStudent={setClaimedStudent}
                onVerify={() => handleVerifyByToken()}
                isVerifying={isVerifying}
              />
            )}
            {activeTab === 'document' && (
              <DocumentVerifyForm
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                onVerify={handleVerifyByDocument}
                isVerifying={isVerifying}
              />
            )}
            {activeTab === 'hash' && (
              <HashVerifyForm
                docHash={docHash}
                setDocHash={setDocHash}
                onVerify={handleVerifyByHash}
                isVerifying={isVerifying}
              />
            )}

            {errorMsg && (
              <div className="alert alert-error" style={{ marginTop: '1.25rem' }}>
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {verificationResult && <VerificationResultCard result={verificationResult} />}
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

export default function PublicVerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading verifier...</div>}>
      <VerifyPortalContent />
    </Suspense>
  );
}
