import React from 'react';

export default function QrCodeModal({ data, onClose }) {
  if (!data) return null;

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = data.dataUrl;
    link.download = `MSU-TCTO-Credential-${data.tokenId}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Verification QR Code
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Token #{data.tokenId}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>

        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          {/* QR Code */}
          <div style={{
            background: '#ffffff',
            padding: '1rem',
            display: 'inline-block',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
          }}>
            <img
              src={data.dataUrl}
              alt={`Verification QR code for Token #${data.tokenId}`}
              style={{ width: '220px', height: '220px', display: 'block' }}
            />
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Print this QR code on physical diplomas. When scanned, it links directly to the credential 
            verification page.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={downloadQR}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Download PNG
            </button>
            <a
              href={`/verify/${data.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              Open Verify Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
