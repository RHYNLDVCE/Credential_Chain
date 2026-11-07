import React, { useState, useMemo, useEffect } from 'react';
import {
  MSU_TCTO_ACADEMIC_STRUCTURE,
  getAllColleges,
  getDepartmentsByCollege,
  getProgramsByDepartment,
  getMajorsByProgram,
} from '@/lib/data/academicStructure';
import { useMetaMask } from '@/lib/context/MetaMaskContext';
import MetaMaskFoxIcon from './MetaMaskFoxIcon';

export default function SingleIssuanceTab({ token, onIssuanceComplete, onOpenLogin }) {
  const colleges = useMemo(() => getAllColleges(), []);
  const { account } = useMetaMask();

  // Form State
  const [formData, setFormData] = useState({
    credentialType: 'Diploma',
    studentAddress: '',
    studentName: '',
    studentId: '',
    college: 'College of Computer Studies',
    department: 'Department of Information Technology',
    degreeTitle: 'Bachelor of Science in Information Technology',
    major: 'Network Systems',
    graduationDate: new Date().toISOString().split('T')[0],
    honors: 'None',
    gpa: '',
  });

  const [isManualOverride, setIsManualOverride] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState('');
  const [issuedReceipt, setIssuedReceipt] = useState(null);

  // Derived options based on current selections
  const availableDepartments = useMemo(() => {
    return getDepartmentsByCollege(formData.college);
  }, [formData.college]);

  const availablePrograms = useMemo(() => {
    return getProgramsByDepartment(formData.college, formData.department);
  }, [formData.college, formData.department]);

  const availableMajors = useMemo(() => {
    return getMajorsByProgram(formData.college, formData.department, formData.degreeTitle);
  }, [formData.college, formData.department, formData.degreeTitle]);

  // Handlers for cascading selects
  const handleCollegeChange = (e) => {
    const selectedCollegeName = e.target.value;
    const depts = getDepartmentsByCollege(selectedCollegeName);
    const firstDept = depts[0]?.name || '';
    const progs = getProgramsByDepartment(selectedCollegeName, firstDept);
    const firstProg = progs[0]?.title || '';
    const majors = getMajorsByProgram(selectedCollegeName, firstDept, firstProg);
    const firstMajor = majors[0] || 'General';

    setFormData((prev) => ({
      ...prev,
      college: selectedCollegeName,
      department: firstDept,
      degreeTitle: firstProg,
      major: firstMajor,
    }));
  };

  const handleDepartmentChange = (e) => {
    const selectedDeptName = e.target.value;
    const progs = getProgramsByDepartment(formData.college, selectedDeptName);
    const firstProg = progs[0]?.title || '';
    const majors = getMajorsByProgram(formData.college, selectedDeptName, firstProg);
    const firstMajor = majors[0] || 'General';

    setFormData((prev) => ({
      ...prev,
      department: selectedDeptName,
      degreeTitle: firstProg,
      major: firstMajor,
    }));
  };

  const handleProgramChange = (e) => {
    const selectedProgTitle = e.target.value;
    const majors = getMajorsByProgram(formData.college, formData.department, selectedProgTitle);
    const firstMajor = majors[0] || 'General';

    setFormData((prev) => ({
      ...prev,
      degreeTitle: selectedProgTitle,
      major: firstMajor,
    }));
  };

  const livePreview = useMemo(() => {
    try {
      const cleanAddress = formData.studentAddress.trim() || '0x0000000000000000000000000000000000000000';
      const record = {
        credentialType: formData.credentialType,
        college: formData.college.trim(),
        department: formData.department.trim(),
        degreeTitle: formData.degreeTitle.trim(),
        major: formData.major.trim(),
        graduationDate: formData.graduationDate,
        honors: formData.honors,
        institutionId: 'MSU-TCTO',
        nonce: 'auto-generated-16-bytes',
        studentAddress: cleanAddress.toLowerCase(),
        studentId: formData.studentId.trim() || '2026-XXXX',
        studentName: formData.studentName.trim() || 'Candidate Name',
        version: '1.0.0',
      };
      if (formData.gpa) record.gpa = formData.gpa.trim();
      return JSON.stringify(record, null, 2);
    } catch (e) {
      return '{}';
    }
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { onOpenLogin(); return; }

    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.studentAddress.trim())) {
      setMintError('Please enter a valid Ethereum address (42 characters, starting with 0x).');
      return;
    }

    setIsMinting(true);
    setMintError('');
    setIssuedReceipt(null);

    try {
      let res;
      if (selectedFile) {
        const data = new FormData();
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));
        data.append('file', selectedFile);
        res = await fetch('/api/credentials/issue', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        });
      } else {
        res = await fetch('/api/credentials/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to mint credential');
      setIssuedReceipt(result.data);
      onIssuanceComplete();
    } catch (err) {
      setMintError(err.message || 'An error occurred during minting.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <h2>Issue Single Academic Credential</h2>
        <p>
          Confer university-verified credentials across any college and academic program in MSU-TCTO. 
          The record will be cryptographically anchored on the blockchain and pinned to decentralized IPFS storage.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Recipient Details */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              1. Graduate Identity
            </span>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Student Ethereum Wallet Address *</label>
                  {account && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, studentAddress: account }))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                      title="Auto-fill with connected MetaMask address"
                    >
                      <MetaMaskFoxIcon size={13} />
                      <span>Use My Wallet ({account.slice(0, 6)}...{account.slice(-4)})</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={formData.studentAddress}
                  onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
                  placeholder="0x..."
                  required
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Target EVM account for Soulbound Token ownership.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Al-Mansoor J. Sali"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID Number *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g. 2022-0183"
                    required
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }}></div>

          {/* Academic Unit Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                2. Academic Program & Unit
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsManualOverride(!isManualOverride)}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
              >
                {isManualOverride ? 'Use Catalog Dropdowns' : 'Manual Custom Entry'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Credential Document Type *</label>
                <select
                  className="input-field"
                  value={formData.credentialType}
                  onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
                  required
                >
                  <option value="Diploma">Diploma</option>
                  <option value="Transcript of Records (TOR)">Transcript of Records (TOR)</option>
                  <option value="Certificate of Graduation">Certificate of Graduation</option>
                </select>
              </div>

              {!isManualOverride ? (
                <>
                  {/* Cascading: College */}
                  <div className="form-group">
                    <label className="form-label">College / Academic School *</label>
                    <select
                      className="input-field"
                      value={formData.college}
                      onChange={handleCollegeChange}
                      required
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cascading: Department */}
                  <div className="form-group">
                    <label className="form-label">Department / Academic Division *</label>
                    <select
                      className="input-field"
                      value={formData.department}
                      onChange={handleDepartmentChange}
                      required
                    >
                      {availableDepartments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cascading: Degree Program */}
                  <div className="form-group">
                    <label className="form-label">Degree Program *</label>
                    <select
                      className="input-field"
                      value={formData.degreeTitle}
                      onChange={handleProgramChange}
                      required
                    >
                      {availablePrograms.map((p) => (
                        <option key={p.title} value={p.title}>
                          {p.title} ({p.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cascading: Major / Specialization */}
                  <div className="form-group">
                    <label className="form-label">Major / Field of Specialization *</label>
                    {availableMajors.length > 0 ? (
                      <select
                        className="input-field"
                        value={formData.major}
                        onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        required
                      >
                        {availableMajors.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="input-field"
                        value={formData.major}
                        onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        placeholder="General / Non-majored"
                      />
                    )}
                  </div>
                </>
              ) : (
                /* Manual Custom Entry Mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                  <div className="form-group">
                    <label className="form-label">College Name (Custom)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. College of Computer Studies"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department Name (Custom)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Department of Information Technology"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Degree Title (Custom)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.degreeTitle}
                      onChange={(e) => setFormData({ ...formData, degreeTitle: e.target.value })}
                      placeholder="e.g. Bachelor of Science in Information Technology"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Major / Track (Custom)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      placeholder="e.g. Cybersecurity and Network Systems"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }}></div>

          {/* Academic Honors, GPA, Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Honors</label>
              <select
                className="input-field"
                value={formData.honors}
                onChange={(e) => setFormData({ ...formData, honors: e.target.value })}
              >
                <option value="None">None</option>
                <option value="Summa Cum Laude">Summa Cum Laude</option>
                <option value="Magna Cum Laude">Magna Cum Laude</option>
                <option value="Cum Laude">Cum Laude</option>
                <option value="Academic Distinction">Academic Distinction</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GPA (Optional)</label>
              <input
                type="text"
                className="input-field"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                placeholder="e.g. 1.25"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Graduation Date *</label>
              <input
                type="date"
                className="input-field"
                value={formData.graduationDate}
                onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="form-group">
            <label className="form-label">Attach Document File (Optional PDF or Image)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="input-field"
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          {mintError && (
            <div className="alert alert-error">{mintError}</div>
          )}

          <button
            type="submit"
            disabled={isMinting}
            className="btn btn-primary"
            style={{ padding: '11px', marginTop: '6px' }}
          >
            {isMinting ? 'Minting Sovereign Credential...' : 'Issue Credential to Blockchain'}
          </button>
        </form>

        {/* Live Preview Panel */}
        <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Decentralized Credential Record Preview
            </span>
            <span className="badge badge-neutral">Live Canonical JSON</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem' }}>
            <span className="badge badge-active">{formData.credentialType}</span>
            <span className="badge badge-neutral">{formData.college}</span>
            <span className="badge badge-neutral">{formData.department}</span>
          </div>

          <pre className="code-box" style={{ flex: 1, margin: 0, minHeight: '340px', fontSize: '0.76rem', lineHeight: '1.45' }}>
            {livePreview}
          </pre>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            This JSON object is canonicalized, hashed with SHA-256 into <code>docHash</code>, pinned to IPFS, and permanently anchored on Ethereum Sepolia.
          </p>
        </div>
      </div>

      {/* Success Receipt */}
      {issuedReceipt && (
        <div className="panel" style={{ padding: '1.5rem', borderColor: 'var(--status-ok-border)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-ok-text)', marginBottom: '4px' }}>
              Credential Successfully Minted — Token #{issuedReceipt.tokenId}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              The academic credential for {issuedReceipt.studentName || 'the graduate'} is now immutably verified.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Transaction Hash', value: issuedReceipt.txHash },
              { label: 'SHA-256 Document Hash', value: issuedReceipt.docHash },
              { label: 'IPFS Content ID', value: issuedReceipt.ipfsCID },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
