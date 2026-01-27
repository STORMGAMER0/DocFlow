import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, deleteDocument } from '../services/api';
import { toast } from 'react-toastify';

function DocumentDetail({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
  try {
    const response = await getDocument(id);
    setDocument(response.data);
  } catch (error) {
    toast.error('Failed to load document');
    navigate('/dashboard');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
  if (!window.confirm('Delete this document?')) return;

  try {
    await deleteDocument(id);
    toast.success('🗑️ Document deleted');
    navigate('/dashboard');
  } catch (error) {
    toast.error('Delete failed: ' + error.message);
  }
};
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.5rem' }}>Loading...</div>
      </div>
    );
  }

  const metadata = document.metadata_results || {};

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
          <button 
            onClick={handleDelete}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            Delete Document
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Document Info */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>{document.filename}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <div><strong>ID:</strong> {document.id}</div>
            <div><strong>Status:</strong> <span style={{ color: document.status === 'completed' ? '#10b981' : '#f59e0b' }}>{document.status}</span></div>
            <div><strong>Uploaded:</strong> {document.created_at ? new Date(document.created_at).toLocaleString() : 'N/A'}</div>
            <div><strong>Storage:</strong> {document.s3_key}</div>
          </div>
        </div>

        {/* AI Summary */}
        {metadata.summary && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              🤖 AI Summary
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.6' }}>{metadata.summary}</p>
          </div>
        )}

        {/* Metadata */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📊 Extracted Metadata</h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {metadata.dates && metadata.dates.length > 0 && (
              <div>
                <strong style={{ color: '#6b7280' }}>📅 Dates:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {metadata.dates.map((date, idx) => (
                    <span key={idx} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metadata.emails && metadata.emails.length > 0 && (
              <div>
                <strong style={{ color: '#6b7280' }}>📧 Emails:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {metadata.emails.map((email, idx) => (
                    <span key={idx} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metadata.amounts && metadata.amounts.length > 0 && (
              <div>
                <strong style={{ color: '#6b7280' }}>💰 Amounts:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {metadata.amounts.map((amount, idx) => (
                    <span key={idx} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      {amount}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!metadata.dates || metadata.dates.length === 0) && 
             (!metadata.emails || metadata.emails.length === 0) && 
             (!metadata.amounts || metadata.amounts.length === 0) && (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No metadata extracted</p>
            )}
          </div>
        </div>

        {/* Extracted Text */}
        {document.content && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📄 Extracted Text</h2>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '0.375rem', 
              maxHeight: '500px', 
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.6'
            }}>
              {document.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentDetail;