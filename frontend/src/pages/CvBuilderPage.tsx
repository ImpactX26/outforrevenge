import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  FileText,
  Sparkles,
  Download,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Sliders,
  Layers,
  FileCheck2,
  Send,
  Eye,
} from 'lucide-react';
import { CV } from '../types';

export const CvBuilderPage: React.FC = () => {
  const [cvList, setCvList] = useState<CV[]>([]);
  const [activeCv, setActiveCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('GERMAN_STANDARD');
  const [summaryText, setSummaryText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchCvs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/cv');
      if (res.data.success && res.data.cvs) {
        setCvList(res.data.cvs);
        if (res.data.cvs.length > 0) {
          const current = res.data.cvs[0];
          setActiveCv(current);
          setSummaryText(current.summary || '');
        }
      }
    } catch (err) {
      console.error('Failed to load CVs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  const handleGenerateNew = async () => {
    try {
      setGenerating(true);
      setStatusMsg(null);
      const res = await apiClient.post('/cv/generate', { templateName: selectedTemplate });
      if (res.data.success && res.data.cv) {
        setStatusMsg('New German Lebenslauf generated from verified dossier credentials!');
        await fetchCvs();
      }
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to generate CV.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePolishSummary = async () => {
    if (!activeCv) return;
    try {
      setPolishing(true);
      const res = await apiClient.post(`/cv/${activeCv.id}/improve-section`, {
        sectionName: 'summary',
        content: summaryText,
      });
      if (res.data.success && res.data.improvedContent) {
        setSummaryText(res.data.improvedContent);
        setActiveCv({ ...activeCv, summary: res.data.improvedContent });
        setStatusMsg('Summary polished to idiomatic German professional standard!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to polish summary.');
    } finally {
      setPolishing(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!activeCv) return;
    try {
      await apiClient.patch(`/cv/${activeCv.id}`, { summary: summaryText });
      setStatusMsg('CV summary updated successfully!');
    } catch (err) {
      alert('Failed to save summary.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!activeCv) return;
    try {
      const response = await apiClient.get(`/cv/${activeCv.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lebenslauf_${activeCv.personalInfo?.fullName?.replace(/\s+/g, '_') || 'Nexora'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF.');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            German Standard Lebenslauf Builder (DIN 5008)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Generates compliant German CVs formatted chronologically (antichronologischer Lebenslauf) with German typography, language certificates, and academic conversion.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerateNew}
            disabled={generating}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            {generating ? <RefreshCw className="animate-spin" size={15} /> : <Sparkles size={15} />}
            <span>Regenerate from Dossier</span>
          </button>

          {activeCv && (
            <button
              onClick={handleDownloadPdf}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.6rem 1.25rem' }}
            >
              <Download size={16} />
              <span>Download Official PDF</span>
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
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
          <span>{statusMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
        </div>
      ) : activeCv ? (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Editor & AI Polish */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Version Switcher */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Active Version ({cvList.length} total)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {cvList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCv(c);
                      setSummaryText(c.summary || '');
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeCv?.id === c.id ? '#3b82f6' : 'var(--border-subtle)',
                      background: activeCv?.id === c.id ? 'rgba(37, 99, 235, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      color: activeCv?.id === c.id ? '#60a5fa' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    v{c.version || 1} &bull; {c.templateName || 'Standard'}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selector */}
            <div className="card" style={{ padding: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                German CV Layout Style
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="GERMAN_STANDARD">Standard German (DIN 5008 Tabellarisch)</option>
                <option value="ACADEMIC">Academic / Research Focus (Uni-Assist)</option>
                <option value="MODERN_TECH">Modern Tech & Engineering</option>
              </select>
            </div>

            {/* AI Summary Editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  Profil / Kurzprofil
                </span>
                <button
                  onClick={handlePolishSummary}
                  disabled={polishing}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {polishing ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  <span>AI Polish</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Kurzprofil auf Deutsch oder Englisch..."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  lineHeight: '1.4',
                }}
              />

              <button
                onClick={handleSaveSummary}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem', width: '100%' }}
              >
                Save Summary Changes
              </button>
            </div>
          </div>

          {/* Right Column: Live Lebenslauf Preview (Paper Clean DIN Format) */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '2.5rem',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {/* CV Header */}
            <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                {activeCv.personalInfo?.fullName || 'Bewerber Name'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, marginBottom: '0.5rem' }}>
                LEBENSLAUF
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>Email: {activeCv.personalInfo?.email || 'email@example.com'}</span>
                {activeCv.personalInfo?.phone && <span>Tel: {activeCv.personalInfo.phone}</span>}
                {activeCv.personalInfo?.location && <span>Wohnort: {activeCv.personalInfo.location}</span>}
              </div>
            </div>

            {/* Profile Summary */}
            {summaryText && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                  PROFIL
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                  {summaryText}
                </p>
              </div>
            )}

            {/* Beruflicher Werdegang (Work Experience) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>
                BERUFLICHER WERDEGANG
              </h4>
              {activeCv.employmentData && activeCv.employmentData.length > 0 ? (
                activeCv.employmentData.map((emp: any, idx: number) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      {emp.startDate || 'Start'} &mdash; {emp.endDate || 'Present'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {emp.role} &bull; <span style={{ color: '#2563eb' }}>{emp.companyName}</span>
                      </div>
                      {emp.responsibilities && (
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
                          {emp.responsibilities}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Keine Berufserfahrung angegeben.</div>
              )}
            </div>

            {/* Ausbildung (Education) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>
                AUSBILDUNG & STUDIUM
              </h4>
              {activeCv.educationData && activeCv.educationData.length > 0 ? (
                activeCv.educationData.map((edu: any, idx: number) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      {edu.graduationDate || 'Graduiert'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {edu.institution} {edu.gradeOrCgpa && `(Note / GPA: ${edu.gradeOrCgpa})`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Keine Ausbildung hinterlegt.</div>
              )}
            </div>

            {/* Kenntnisse & Sprachen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                  KENNTNISSE
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {activeCv.skillsData?.map((s: any, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        background: '#f1f5f9',
                        color: '#334155',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {s.name || s}
                    </span>
                  )) || <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Keine Kenntnisse</span>}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                  SPRACHKENNTNISSE (GER)
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  {activeCv.languagesData?.map((l: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '0.25rem' }}>
                      <strong>{l.language}:</strong> {l.proficiencyLevel} {l.certificateType && `(${l.certificateType})`}
                    </div>
                  )) || <div>Keine Sprachen erfasst.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <FileCheck2 size={40} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
            No German Lebenslauf Generated Yet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Nexora will convert your verified credentials, employment dates, and university grades into an official German DIN 5008 CV.
          </p>
          <button onClick={handleGenerateNew} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Generate German Lebenslauf
          </button>
        </div>
      )}
    </div>
  );
};

export default CvBuilderPage;
