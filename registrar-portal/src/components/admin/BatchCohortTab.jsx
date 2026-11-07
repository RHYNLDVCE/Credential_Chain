import React, { useState } from 'react';

export default function BatchCohortTab({ token, onIssuanceComplete, onOpenLogin }) {
  const [cohortName, setCohortName] = useState(`BSIT Graduating Cohort ${new Date().getFullYear()}`);
  const [selectedFile, setSelectedFile] = useState(null);
  const [cohortPreview, setCohortPreview] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [batchReceipt, setBatchReceipt] = useState(null);

  const handlePreviewUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setErrorMsg('Please select a CSV or JSON cohort file.'); return; }
    if (!token) { onOpenLogin(); return; }

    setIsValidating(true);
    setErrorMsg('');
    setCohortPreview(null);
    setBatchReceipt(null);

    try {
      const data = new FormData();
      data.append('roster', selectedFile);
      const res = await fetch('/api/cohorts/preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to preview roster');
      setCohortPreview(result.data);
    } catch (err) {
      setErrorMsg(err.message || 'Error parsing cohort file');
    } finally {
      setIsValidating(false);
    }
  };

  const handleIssueBatch = async () => {
    if (!cohortPreview || cohortPreview.validCount === 0) return;
    if (!token) { onOpenLogin(); return; }

    setIsMinting(true);
    setErrorMsg('');

    try {
      const validRecords = cohortPreview.records.filter((r) => r.isValid).map((r) => r.data);
      const res = await fetch('/api/cohorts/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cohortName, credentials: validRecords }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to mint batch');
      setBatchReceipt(result.data);
      onIssuanceComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Error issuing batch');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <h2>Batch Cohort Import</h2>
        <p>
          Upload a CSV or JSON roster file to issue credentials for an entire graduating cohort at once. 
          Each record is validated before being submitted to the blockchain.
        </p>
      </div>

      {/* Upload Configuration */}
      <div className="panel" style={{ padding: '1.5rem' }}>
        <form onSubmit={handlePreviewUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cohort Batch Name</label>
              <input
                type="text"
                className="input-field"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label className="form-label" style={{ margin: 0 }}>Roster File (CSV or JSON)</label>
                <a
                  href="/sample-cohort.csv"
                  download
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
                >
                  Download sample CSV
                </a>
              </div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                required
              />
            </div>
          </div>

          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

          <div>
            <button
              type="submit"
              disabled={isValidating || !selectedFile}
              className="btn btn-secondary"
            >
              {isValidating ? 'Validating Records...' : 'Preview and Validate Roster'}
            </button>
          </div>
        </form>
      </div>

      {/* Roster Preview Table */}
      {cohortPreview && (
        <div className="panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                Roster Validation Results
              </h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--status-ok-text)', fontWeight: 600 }}>
                  {cohortPreview.validCount} valid
                </span>
                {cohortPreview.invalidCount > 0 && (
                  <span style={{ color: 'var(--status-err-text)', fontWeight: 600 }}>
                    {cohortPreview.invalidCount} invalid
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)' }}>
                  {cohortPreview.total} total
                </span>
              </div>
            </div>

            <button
              onClick={handleIssueBatch}
              disabled={isMinting || cohortPreview.validCount === 0}
              className="btn btn-primary"
            >
              {isMinting
                ? 'Minting...'
                : `Issue ${cohortPreview.validCount} Credentials`}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Wallet Address</th>
                  <th>Honors</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cohortPreview.records.map((rec) => (
                  <tr key={rec.rowNumber}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {rec.rowNumber}
                    </td>
                    <td style={{ fontWeight: 600 }}>{rec.data.studentName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{rec.data.studentId}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rec.data.studentAddress
                        ? `${rec.data.studentAddress.substring(0, 8)}...`
                        : 'Missing'}
                    </td>
                    <td>{rec.data.honors || 'None'}</td>
                    <td>
                      <span className={`badge ${rec.isValid ? 'badge-active' : 'badge-revoked'}`}>
                        {rec.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Receipt */}
      {batchReceipt && (
        <div className="panel" style={{ padding: '1.5rem', borderColor: 'var(--status-ok-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-ok-text)', marginBottom: '0.5rem' }}>
            Batch Successfully Issued
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            All valid records have been minted on-chain and stored on IPFS.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Student</th>
                  <th>Transaction Hash</th>
                  <th>IPFS CID</th>
                </tr>
              </thead>
              <tbody>
                {batchReceipt.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{item.tokenId}</td>
                    <td>{item.studentName || item.studentAddress?.substring(0, 10)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.txHash ? `${item.txHash.substring(0, 14)}...` : 'Pending'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.ipfsCID ? `${item.ipfsCID.substring(0, 12)}...` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
