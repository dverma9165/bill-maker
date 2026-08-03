import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink, RefreshCw, Download } from 'lucide-react';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;

// Bill images are stored as Drive "view" links; swapping to export=download
// makes the browser save the file instead of opening the Drive preview page.
const getDownloadUrl = (viewUrl) => viewUrl.replace('export=view', 'export=download');

const ViewBills = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBills = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${APPSCRIPT_URL}?sheet=${SHEET_NAME}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch bills');
      }

      // Assuming first row is headers if it exists, or just mapping directly.
      // Schema: [Date Created, Bill No, Bill Date, Recipient, Total Amount, Image URL, Raw JSON]
      setBills(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching bills');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="page-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">All Saved Invoices</h1>
          <p className="page-subtitle">View and manage your previous tax invoices</p>
        </div>
        <button 
          onClick={fetchBills} 
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Refresh List
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: '24px', fontWeight: '500' }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {isLoading ? (
          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={40} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
            <span style={{ fontSize: '15px', fontWeight: '500' }}>Loading your invoices securely...</span>
          </div>
        ) : bills.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#334155', margin: '0 0 8px 0' }}>No Invoices Found</p>
            <p style={{ fontSize: '14px', margin: 0 }}>Create a new invoice and it will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: '#64748b' }}>SN</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: '#64748b' }}>Customer/Shop Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: '#64748b' }}>Mobile Number</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: '#64748b' }}>Address</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: '#64748b' }}>Bill Number</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Bill Image</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((row, index) => {
                  if (index === 0 && row[0] === 'SN') return null;
                  
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>{row[0] || '-'}</td>
                      <td style={{ padding: '16px 20px', color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>{row[1] || '-'}</td>
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>{row[2] || '-'}</td>
                      <td style={{ padding: '16px 20px', color: '#475569', fontSize: '14px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row[3] || '-'}</td>
                      <td style={{ padding: '16px 20px', color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>{row[4] || '-'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        {row[5] ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href={row[5]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#eef2ff', color: 'var(--primary)', textDecoration: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease' }}
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e0e7ff'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.transform = 'none' }}
                            >
                              <ExternalLink size={14} />
                              View Image
                            </a>
                            <a
                              href={getDownloadUrl(row[5])}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#334155', textDecoration: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease' }}
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.transform = 'none' }}
                            >
                              <Download size={14} />
                              Download
                            </a>
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBills;
