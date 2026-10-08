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
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Briefcase,
  GraduationCap,
  Languages,
  PenTool,
  ExternalLink,
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
      setTimeout(() => setStatusMsg(null), 3500);
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

  const currentDateFormatted = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.92))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.5)',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <FileCheck2 size={13} />
              DIN 5008 Tabellarischer Standard
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <ShieldCheck size={13} />
              Antichronologisch (German Employer Standard)
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            German Standard Lebenslauf Builder
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
            Transform your verified academic credentials and work history into a regulatory DIN 5008 tabellarischer Lebenslauf. Formatted chronologically with reverse dating, Bavarian grading conversion, and German vocational terminology.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerateNew}
            disabled={generating}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.65rem 1.15rem' }}
          >
            {generating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span>Regenerate from Dossier</span>
          </button>

          {activeCv && (
            <button
              onClick={handleDownloadPdf}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
                padding: '0.65rem 1.35rem',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
              }}
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
          <span>{statusMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" />
          <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>Loading German CV dossier...</p>
        </div>
      ) : activeCv ? (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.75rem', alignItems: 'flex-start' }}>
          {/* Left Column: Editor & Control Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Version Switcher */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CV Versions
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {cvList.length} saved
                </span>
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
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: activeCv?.id === c.id ? '#3b82f6' : 'var(--border-subtle)',
                      background: activeCv?.id === c.id ? 'rgba(37, 99, 235, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      color: activeCv?.id === c.id ? '#60a5fa' : '#94a3b8',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    v{c.version || 1} &bull; {c.templateName?.replace('_', ' ') || 'Standard'}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selector */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                German CV Layout Framework
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="GERMAN_STANDARD">Standard DIN 5008 (Tabellarisch - Vocational / Employment)</option>
                <option value="ACADEMIC">Academic / Research Focus (Uni-Assist / Master's)</option>
                <option value="MODERN_TECH">Modern Tech & Engineering (MINT / Blue Card)</option>
              </select>
            </div>

            {/* AI Summary Editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PenTool size={14} color="#60a5fa" />
                  Kurzprofil / Executive Summary
                </span>
                <button
                  onClick={handlePolishSummary}
                  disabled={polishing}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {polishing ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  <span>Polish (German)</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Kurzprofil auf Deutsch oder Englisch..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.84rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />

              <button
                onClick={handleSaveSummary}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.55rem', width: '100%' }}
              >
                Save Summary Updates
              </button>
            </div>

            {/* DIN 5008 Rule Sheet Card */}
            <div
              className="card"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} color="#38bdf8" />
                DIN 5008 Compliance Checklist
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.6' }}>
                <li>Antichronological order (most recent position first)</li>
                <li>Standard German date format (MM/YYYY or DD.MM.YYYY)</li>
                <li>No unexplained gaps (lückenloser Lebenslauf)</li>
                <li>Official CEFR language proficiency standards (A1–C2)</li>
                <li>Concludes with place, date, and applicant signature</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Lebenslauf Preview (Paper Clean DIN Format) */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '3rem 3.25rem',
              borderRadius: '12px',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.65)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              minHeight: '900px',
            }}
          >
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #1e3a8a', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
                  {activeCv.personalInfo?.fullName || 'Bewerber Name'}
                </h2>
                <div style={{ fontSize: '0.95rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Lebenslauf
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', lineHeight: '1.4' }}>
                  <span><strong>E-Mail:</strong> {activeCv.personalInfo?.email || 'email@example.com'}</span>
                  {activeCv.personalInfo?.phone && <span><strong>Tel:</strong> {activeCv.personalInfo.phone}</span>}
                  {activeCv.personalInfo?.location && <span><strong>Wohnort:</strong> {activeCv.personalInfo.location}</span>}
                </div>
              </div>

              {/* Photo Frame Placeholder (German Standard Application Photo) */}
              <div
                style={{
                  width: '95px',
                  height: '125px',
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '0.65rem',
                  textAlign: 'center',
                  padding: '0.25rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#334155' }}>Bewerbungsfoto</div>
                <div style={{ fontSize: '0.58rem', marginTop: '0.15rem' }}>45 × 35 mm</div>
              </div>
            </div>

            {/* Profile Summary */}
            {summaryText && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
                  Kurzprofil
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                  {summaryText}
                </p>
              </div>
            )}

            {/* Beruflicher Werdegang (Work Experience) */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.85rem', letterSpacing: '0.05em' }}>
                Beruflicher Werdegang
              </h4>
              {activeCv.employmentData && activeCv.employmentData.length > 0 ? (
                activeCv.employmentData.map((emp: any, idx: number) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {emp.startDate || 'Start'} &ndash; {emp.endDate || 'Heute'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                        {emp.role} &bull; <span style={{ color: '#1d4ed8' }}>{emp.companyName}</span>
                      </div>
                      {emp.responsibilities && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
                          {emp.responsibilities}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  Keine vorherige Berufserfahrung erfasst.
                </div>
              )}
            </div>

            {/* Ausbildung (Education) */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.85rem', letterSpacing: '0.05em' }}>
                Schul- & Hochschulausbildung
              </h4>
              {activeCv.educationData && activeCv.educationData.length > 0 ? (
                activeCv.educationData.map((edu: any, idx: number) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {edu.graduationDate || 'Abschluss'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
                        {edu.institution} {edu.gradeOrCgpa && `\u2022 Abschlussnote / GPA: ${edu.gradeOrCgpa}`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  Keine formelle Ausbildung hinterlegt.
                </div>
              )}
            </div>

            {/* Kenntnisse & Sprachen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
                  Fachkenntnisse & IT
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {activeCv.skillsData && activeCv.skillsData.length > 0 ? (
                    activeCv.skillsData.map((s: any, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.25rem 0.6rem',
                          background: '#f1f5f9',
                          color: '#1e293b',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 600,
                        }}
                      >
                        {s.name || s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Keine Kenntnisse angegeben.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
                  Sprachkenntnisse (GER / CEFR)
                </h4>
                <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                  {activeCv.languagesData && activeCv.languagesData.length > 0 ? (
                    activeCv.languagesData.map((l: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{l.language}:</strong> {l.proficiencyLevel}</span>
                        {l.certificateType && (
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({l.certificateType})</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div>Keine Sprachzertifikate erfasst.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Ort, Datum & Unterschrift (Official DIN 5008 Closing) */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {activeCv.personalInfo?.location || 'Deutschland'}, den {currentDateFormatted}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  Ort, Datum
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ width: '180px', borderBottom: '1px solid #0f172a', marginBottom: '0.35rem' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeCv.personalInfo?.fullName || 'Bewerber Name'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  (Unterschrift / Signature)
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
          <FileCheck2 size={44} color="#3b82f6" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
            No German Lebenslauf Generated Yet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
            Nexora will convert your uploaded degree certificates, transcripts, and employment records into a certified DIN 5008 German tabellarischer Lebenslauf.
          </p>
          <button onClick={handleGenerateNew} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem' }}>
            Generate German Lebenslauf
          </button>
        </div>
      )}
    </div>
  );
};

export default CvBuilderPage;
