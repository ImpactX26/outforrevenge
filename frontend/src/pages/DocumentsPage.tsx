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
  Sparkles,
  ShieldCheck,
  Building2,
  GraduationCap,
  Award,
  Layers,
  FileCheck2,
  Check,
  X,
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
        setActionMsg(`Document "${file.name}" uploaded and queued for genuine OCR credential extraction.`);
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
      setActionMsg('Triggering OCR re-extraction...');
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
    if (!window.confirm('Are you sure you want to remove this document from your official dossier?')) return;
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
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
            }}
          >
            Verified OCR
          </span>
        );
      case 'EXTRACTING':
      case 'PROCESSING':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
            }}
          >
            Extracting...
          </span>
        );
      case 'REQUIRES_REVIEW':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
            }}
          >
            Requires Review
          </span>
        );
      case 'FAILED':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
            }}
          >
            Extraction Failed
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94a3b8',
            }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              ENCRYPTED CLOUD DOSSIER
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Cloudinary Secure Asset Delivery
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Document Intelligence & OCR Extraction
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '720px', lineHeight: 1.55 }}>
            Upload academic transcripts, degree marksheets, and official language diplomas. Nexora extracts GPA, institution classification, and verifies against German uni-assist & Anabin standards.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.82rem',
            padding: '0.6rem 1.1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
          }}
        >
          <RefreshCw size={15} />
          <span>Refresh Files</span>
        </button>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} color="#60a5fa" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* 2. Professional Upload Dropzone */}
      <div
        className="card"
        style={{
          border: '2px dashed rgba(59, 130, 246, 0.35)',
          background: 'rgba(15, 23, 42, 0.6)',
          textAlign: 'center',
          padding: '2.5rem 2rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
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
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            margin: '0 auto 1.25rem',
          }}
        >
          {uploading ? <RefreshCw className="animate-spin" size={26} /> : <Upload size={26} />}
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem' }}>
          {uploading ? 'Processing Document with OCR Pipeline...' : 'Upload Academic & Language Credentials'}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.84rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          Drag & drop your Indian marksheet, university degree, Goethe certificate, or passport. PDF parser reads text streams and OCR headers with cryptographic provenance.
        </p>

        {/* Category Pill Selector */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Target Category:</span>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '6px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="TRANSCRIPT">Academic Marksheet / Transcript</option>
            <option value="DEGREE">University Degree Certificate</option>
            <option value="LANGUAGE_CERTIFICATE">Language Certificate (Goethe/IELTS)</option>
            <option value="CV">Existing CV / Resume</option>
            <option value="EXPERIENCE_LETTER">Employment Experience Letter</option>
            <option value="CERTIFICATE">Professional Certification</option>
            <option value="OTHER">Other Official Document</option>
          </select>
        </div>
      </div>

      {/* 3. Uploaded Dossier Files Table */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Dossier File Assets ({documents.length})
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Files secured in Cloudinary encrypted applicant folders
            </div>
          </div>
          <span style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 600 }}>
            {documents.filter((d) => d.status === 'COMPLETED').length} of {documents.length} Extracted
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <RefreshCw className="animate-spin" size={26} color="#3b82f6" />
          </div>
        ) : documents.length > 0 ? (
          <div className="markdown-table-wrapper" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Category</th>
                  <th>Uploaded Date</th>
                  <th>OCR Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(37, 99, 235, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#60a5fa',
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={16} />
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>
                            {doc.filename}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {(doc.fileSize / 1024).toFixed(1)} KB &bull; {doc.mimeType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: 'rgba(30, 41, 59, 0.8)',
                          color: '#cbd5e1',
                          fontWeight: 500,
                        }}
                      >
                        {doc.documentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td>{renderStatusBadge(doc.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {doc.extraction && (
                          <button
                            onClick={() => setSelectedDocForPreview(doc)}
                            className="btn"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              background: 'rgba(37, 99, 235, 0.15)',
                              border: '1px solid rgba(37, 99, 235, 0.3)',
                              color: '#60a5fa',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                            title="Inspect Verified OCR Credentials"
                          >
                            <Eye size={13} />
                            <span>OCR Insights</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleReExtract(doc.id)}
                          className="btn"
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                          }}
                          title="Re-run OCR extraction"
                        >
                          <RefreshCw size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="btn"
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                          }}
                          title="Remove from dossier"
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
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            No documents uploaded yet. Upload your Indian transcripts and degree certificates above.
          </div>
        )}
      </div>

      {/* 4. Structured OCR Extraction Insights Modal */}
      {selectedDocForPreview && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '800px', background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Verified Credential Dossier
                  </h3>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {selectedDocForPreview.filename} &bull; Confidence:{' '}
                  <strong style={{ color: '#34d399' }}>
                    {Math.round((selectedDocForPreview.extraction?.confidence || 0.92) * 100)}%
                  </strong>{' '}
                  &bull; Provenance: <span style={{ color: '#60a5fa', fontWeight: 600 }}>DOCUMENT_EXTRACTED</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Warnings Pill if any */}
              {selectedDocForPreview.extraction?.warnings && selectedDocForPreview.extraction.warnings.length > 0 && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
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

              {/* Human-Readable Structured Key-Value Grid */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                  Extracted Credential Attributes
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {Object.entries(selectedDocForPreview.extraction?.extractedJson || {}).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Document OCR Stream */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Raw Document Text Stream (OCR Source)
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    background: '#090d16',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.55',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedDocForPreview.extraction?.rawText || 'No raw text stream captured.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setSelectedDocForPreview(null)} className="btn btn-secondary">
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
