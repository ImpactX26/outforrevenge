import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../api/client';
import {
  FileText,
  Upload,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  AlertCircle,
  Sparkles,
  Download,
} from 'lucide-react';
import { DocumentItem, DocumentType, DocumentStatus } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('TRANSCRIPT');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentItem | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setActionMsg(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedDocType);

      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setActionMsg(`Document "${file.name}" uploaded and queued for AI extraction!`);
        await fetchDocuments();
      }
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReExtract = async (id: string) => {
    try {
      setActionMsg('Triggering AI re-extraction...');
      const res = await apiClient.post(`/documents/${id}/re-extract`);
      if (res.data.success) {
        setActionMsg('Document successfully re-extracted with updated parser.');
        await fetchDocuments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Re-extraction failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    try {
      await apiClient.delete(`/documents/${id}`);
      setDocuments(documents.filter((d) => d.id !== id));
      if (selectedDocForPreview?.id === id) setSelectedDocForPreview(null);
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const renderStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">Extraction Complete</span>;
      case 'EXTRACTING':
      case 'PROCESSING':
        return <span className="badge badge-warning">AI Processing...</span>;
      case 'REQUIRES_REVIEW':
        return <span className="badge badge-danger">Review Required</span>;
      case 'FAILED':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Document Dossier & Verification
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Upload academic transcripts, degree certificates, and language diplomas. Nexora extracts GPA, ECTS credits, and verifies against German uni-assist standards.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchDocuments}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className="card"
        style={{
          border: '2px dashed rgba(59, 130, 246, 0.4)',
          background: 'rgba(15, 23, 42, 0.4)',
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept=".pdf,.png,.jpg,.jpeg,.docx"
        />
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            margin: '0 auto 1rem',
          }}
        >
          {uploading ? <RefreshCw className="animate-spin" size={26} /> : <Upload size={26} />}
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
          {uploading ? 'Processing File & Running Extraction...' : 'Click or Drag Documents Here'}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
          Supports PDF, DOCX, and high-resolution scans up to 25MB. PDF parser reads raw text streams and OCR headers.
        </p>

        <div
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Category:</span>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
            style={{
              padding: '0.45rem 0.8rem',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.82rem',
            }}
          >
            <option value="TRANSCRIPT">Academic Transcript</option>
            <option value="DEGREE">Degree Certificate</option>
            <option value="LANGUAGE_CERTIFICATE">Language Certificate (Goethe/IELTS)</option>
            <option value="CV">Existing CV / Lebenslauf</option>
            <option value="EXPERIENCE_LETTER">Employment Experience Letter</option>
            <option value="CERTIFICATE">Professional Certificate</option>
            <option value="OTHER">Other Official Document</option>
          </select>
        </div>
      </div>

      {/* Documents List Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          Uploaded Dossier Files ({documents.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <RefreshCw className="animate-spin" size={24} color="#3b82f6" />
          </div>
        ) : documents.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Document</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Uploaded</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Extraction Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <FileText size={18} color="#60a5fa" />
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{doc.filename}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {(doc.fileSize / 1024).toFixed(1)} KB &bull; {doc.mimeType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#cbd5e1' }}>
                      {doc.documentType.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {renderStatusBadge(doc.status)}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {doc.extraction && (
                          <button
                            onClick={() => setSelectedDocForPreview(doc)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="Inspect AI Extraction"
                          >
                            <Eye size={14} />
                            <span style={{ marginLeft: '0.25rem' }}>Insights</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleReExtract(doc.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Re-run AI extraction"
                        >
                          <RefreshCw size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', color: '#f87171' }}
                          title="Delete document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            No documents uploaded yet. Add your certificates and transcripts above.
          </div>
        )}
      </div>

      {/* Extraction Preview Modal */}
      {selectedDocForPreview && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  AI Extraction Dossier
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {selectedDocForPreview.filename} &bull; Confidence:{' '}
                  <strong style={{ color: '#10b981' }}>
                    {Math.round((selectedDocForPreview.extraction?.confidence || 0.9) * 100)}%
                  </strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            {/* Extracted JSON highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedDocForPreview.extraction?.warnings && selectedDocForPreview.extraction.warnings.length > 0 && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{selectedDocForPreview.extraction.warnings.join('; ')}</span>
                </div>
              )}

              <div className="card" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Extracted Fields & Key-Value Attributes
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    overflowX: 'auto',
                    lineHeight: '1.4',
                  }}
                >
                  {JSON.stringify(selectedDocForPreview.extraction?.extractedJson || {}, null, 2)}
                </pre>
              </div>

              <div className="card" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Raw Document Text Snippet
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5',
                  }}
                >
                  {selectedDocForPreview.extraction?.rawText || 'No raw text stream captured.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setSelectedDocForPreview(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
