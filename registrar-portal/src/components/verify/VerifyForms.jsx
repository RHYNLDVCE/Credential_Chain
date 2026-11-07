import React from 'react';

export function TokenVerifyForm({
  tokenId,
  setTokenId,
  docHash,
  setDocHash,
  claimedStudent,
  setClaimedStudent,
  onVerify,
  isVerifying,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label className="form-label" htmlFor="verify-token-id">
          Credential Token Number *
        </label>
        <input
          id="verify-token-id"
          type="number"
          min="1"
          placeholder="e.g. 1, 2, 42"
          className="input-field"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          The token number is printed on the physical diploma or provided by the credential holder.
        </span>
      </div>

      <details style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <summary style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', marginBottom: '1rem' }}>
          Advanced: Cross-check with document hash and owner address (optional)
        </summary>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="verify-doc-hash">Expected Document Hash</label>
            <input
              id="verify-doc-hash"
              type="text"
              placeholder="0x... (from QR code)"
              className="input-field"
              value={docHash}
              onChange={(e) => setDocHash(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="verify-student-addr">Student Ethereum Address</label>
            <input
              id="verify-student-addr"
              type="text"
              placeholder="0x..."
              className="input-field"
              value={claimedStudent}
              onChange={(e) => setClaimedStudent(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
          </div>
        </div>
      </details>

      <button
        onClick={onVerify}
        disabled={isVerifying || !tokenId}
        className="btn btn-primary"
        style={{ padding: '11px' }}
      >
        {isVerifying ? 'Verifying...' : 'Verify Credential'}
      </button>
    </div>
  );
}

export function DocumentVerifyForm({ selectedFile, setSelectedFile, onVerify, isVerifying }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Upload your degree certificate PDF or image file. The system will calculate the cryptographic SHA-256 
          fingerprint of your file and verify it against the institutional blockchain registry.
        </p>
        <div className="dropzone" style={{ marginBottom: 0 }}>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
          {selectedFile ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Click to select a file
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                PDF or image files accepted
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onVerify}
        disabled={isVerifying || !selectedFile}
        className="btn btn-primary"
        style={{ padding: '11px' }}
      >
        {isVerifying ? 'Checking document...' : 'Check Document'}
      </button>
    </div>
  );
}

export function HashVerifyForm({ docHash, setDocHash, onVerify, isVerifying }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label className="form-label" htmlFor="verify-hash-input">SHA-256 Document Hash *</label>
        <input
          id="verify-hash-input"
          type="text"
          placeholder="0xa06f0443d74455dacbf9f22afd57e12b4949830b3f203d3584bff5829534f65e"
          className="input-field"
          value={docHash}
          onChange={(e) => setDocHash(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
        />
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          A 64-character hexadecimal fingerprint of the credential document. This is embedded in diploma QR codes.
        </span>
      </div>

      <button
        onClick={onVerify}
        disabled={isVerifying || !docHash}
        className="btn btn-primary"
        style={{ padding: '11px' }}
      >
        {isVerifying ? 'Looking up hash...' : 'Search Registry'}
      </button>
    </div>
  );
}
