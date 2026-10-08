import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  FileEdit,
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Building2,
  ArrowRight,
  Save,
  Check,
  FileText,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { OpportunityItem } from '../types';

export const CoverLetterPage: React.FC = () => {
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [activeLetter, setActiveLetter] = useState<any | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'en'>('de');
  const [letterContent, setLetterContent] = useState('');
  const [letterTitle, setLetterTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lettersRes, oppRes] = await Promise.allSettled([
        apiClient.get('/cover-letters'),
        apiClient.get('/opportunities'),
      ]);

      if (lettersRes.status === 'fulfilled' && lettersRes.value.data.success) {
        const letters = lettersRes.value.data.coverLetters || [];
        setCoverLetters(letters);
        if (letters.length > 0) {
          setActiveLetter(letters[0]);
          setLetterContent(letters[0].content || '');
          setLetterTitle(letters[0].title || '');
        }
      }

      if (oppRes.status === 'fulfilled' && oppRes.value.data.success) {
        setOpportunities(oppRes.value.data.opportunities || []);
        if (oppRes.value.data.opportunities?.length > 0) {
          setSelectedOpportunityId(oppRes.value.data.opportunities[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load cover letters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLanguageChange = async (lang: 'de' | 'en') => {
    setSelectedLanguage(lang);
    setStatusMsg(null);

    // Look for existing letter in target language
    const match = coverLetters.find((cl) => {
      const isEn = (cl.title || '').toLowerCase().includes('english') || 
                   (cl.title || '').toLowerCase().includes('cover letter') || 
                   (cl.content || '').startsWith('Dear') ||
                   (cl.content || '').includes('Sincerely');
      return lang === 'en' ? isEn : !isEn;
    });

    if (match) {
      setActiveLetter(match);
      setLetterContent(match.content || '');
      setLetterTitle(match.title || '');
      setStatusMsg(lang === 'en' ? 'Loaded English Cover Letter draft' : 'Deutsches Anschreiben Entwurf geladen');
    } else {
      // Auto-generate in requested language
      try {
        setGenerating(true);
        const res = await apiClient.post('/cover-letters/generate', {
          opportunityId: selectedOpportunityId || undefined,
          language: lang,
        });
        if (res.data.success && res.data.coverLetter) {
          const newLetter = res.data.coverLetter;
          setActiveLetter(newLetter);
          setLetterContent(newLetter.content || '');
          setLetterTitle(newLetter.title || '');
          setStatusMsg(
            lang === 'en'
              ? 'New English Cover Letter generated adhering to international business standards!'
              : 'Neues deutsches Anschreiben nach DIN 5008 generiert!',
          );
          const lettersRes = await apiClient.get('/cover-letters');
          if (lettersRes.data?.coverLetters) {
            setCoverLetters(lettersRes.data.coverLetters);
          }
        }
      } catch (err: any) {
        setStatusMsg(err.response?.data?.message || 'Failed to generate cover letter in ' + lang);
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setStatusMsg(null);
      const res = await apiClient.post('/cover-letters/generate', {
        opportunityId: selectedOpportunityId || undefined,
        language: selectedLanguage,
      });

      if (res.data.success && res.data.coverLetter) {
        setStatusMsg(
          selectedLanguage === 'de'
            ? 'Neues deutsches Anschreiben nach DIN 5008 generiert!'
            : 'New English Cover Letter generated adhering to international business standards!',
        );
        await fetchData();
      }
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to generate cover letter.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!activeLetter) return;
    try {
      setSaving(true);
      const res = await apiClient.patch(`/cover-letters/${activeLetter.id}`, {
        content: letterContent,
        title: letterTitle,
      });
      if (res.data.success) {
        setStatusMsg('Anschreiben draft saved successfully!');
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      alert('Failed to save cover letter changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = letterContent ? letterContent.trim().split(/\s+/).length : 0;
  const selectedOpp = opportunities.find((o) => o.id === selectedOpportunityId);

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
              <FileText size={13} />
              DIN 5008 Briefnorm
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
              German Corporate Etiquette
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Cover Letter & Anschreiben Generator
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
            Tailor professional, high-impact cover letters in English or German (DIN 5008) aligned with target employers and universities. Switch effortlessly between languages while maintaining strict adherence to German business standards.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Target Language
            </label>
            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.85)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => handleLanguageChange('de')}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  background: selectedLanguage === 'de' ? '#2563eb' : 'transparent',
                  color: selectedLanguage === 'de' ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🇩🇪 Deutsch
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  background: selectedLanguage === 'en' ? '#2563eb' : 'transparent',
                  color: selectedLanguage === 'en' ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Target Opportunity
            </label>
            <select
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.82rem',
                maxWidth: '280px',
                outline: 'none',
              }}
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o.organization})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              padding: '0.7rem 1.35rem',
              alignSelf: 'flex-end',
              boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
            }}
          >
            {generating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span>{selectedLanguage === 'de' ? 'Generate Anschreiben' : 'Generate Cover Letter'}</span>
          </button>
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
          <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>Loading Anschreiben drafts...</p>
        </div>
      ) : activeLetter ? (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.75rem', alignItems: 'flex-start' }}>
          {/* Left Column: Letter History & Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Saved Anschreiben ({coverLetters.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {coverLetters.map((cl) => (
                  <button
                    key={cl.id}
                    onClick={() => {
                      setActiveLetter(cl);
                      setLetterContent(cl.content || '');
                      setLetterTitle(cl.title || '');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: activeLetter?.id === cl.id ? '#3b82f6' : 'var(--border-subtle)',
                      background: activeLetter?.id === cl.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: activeLetter?.id === cl.id ? '#fff' : '#cbd5e1',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{cl.title || 'Bewerbungsschreiben'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {new Date(cl.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Controls Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Document Title
              </label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Word count: <strong>{wordCount}</strong></span>
                <span>Language: <strong>{selectedLanguage === 'de' ? 'Deutsch (DIN 5008)' : 'English (International)'}</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.6rem' }}
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.6rem 1rem' }}
                >
                  {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* DIN 5008 Guidelines */}
            <div
              className="card"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={14} color="#38bdf8" />
                {selectedLanguage === 'de' ? 'German Anschreiben Structure' : 'International Cover Letter Structure'}
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.6' }}>
                <li><strong>{selectedLanguage === 'de' ? 'Absender:' : 'Header:'}</strong> Contact information at top right</li>
                <li><strong>{selectedLanguage === 'de' ? 'Empfänger:' : 'Recipient:'}</strong> Company / University address</li>
                <li><strong>{selectedLanguage === 'de' ? 'Betreff:' : 'Subject:'}</strong> Bold, specific reference line</li>
                <li><strong>{selectedLanguage === 'de' ? 'Einleitung:' : 'Introduction:'}</strong> Strong opening (no generic clichés)</li>
                <li><strong>{selectedLanguage === 'de' ? 'Hauptteil:' : 'Body:'}</strong> Match qualifications to target role</li>
                <li><strong>{selectedLanguage === 'de' ? 'Schluss:' : 'Closing:'}</strong> Earliest start date & motivation</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Letter View & Direct Editor */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '3rem 3.25rem',
              borderRadius: '12px',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.65)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            <div style={{ marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', letterSpacing: '-0.01em' }}>
                  {letterTitle || (selectedLanguage === 'de' ? 'Bewerbungsschreiben' : 'Cover Letter')}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
                  {selectedLanguage === 'de'
                    ? 'DIN 5008 Konform • Deutsch (Formales Anschreiben)'
                    : 'International Standard • English (Professional Cover Letter)'}
                </div>
              </div>

              {selectedOpp && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Target Institution</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedOpp.organization}
                  </div>
                </div>
              )}
            </div>

            <textarea
              rows={23}
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '1.5rem',
                fontSize: '0.9rem',
                lineHeight: '1.75',
                color: '#1e293b',
                background: '#f8fafc',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
          <FileEdit size={44} color="#3b82f6" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
            No German Cover Letters Created
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
            Select an opportunity above and generate a personalized German Anschreiben highlighting your credentials, motivation, and vocational readiness.
          </p>
          <button onClick={handleGenerate} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem' }}>
            Generate Cover Letter
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverLetterPage;
