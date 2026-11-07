import React from 'react';

export default function AdminNavigation({ activeTab, setActiveTab, stats }) {
  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'issue', label: 'Issue Credential' },
    { id: 'cohort', label: 'Batch Import', count: stats?.registry?.totalCohorts },
    { id: 'registry', label: 'Credential Registry', count: stats?.onChain?.totalActive },
    { id: 'verifier', label: 'Public Verifier' },
    { id: 'audit', label: 'Audit Trail', count: stats?.registry?.totalAuditLogs },
  ];

  return (
    <nav className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          onClick={() => setActiveTab(tab.id)}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
