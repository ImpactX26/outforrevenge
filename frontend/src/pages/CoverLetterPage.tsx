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
} from 'lucide-react';
import { OpportunityItem } from '../types';

export const CoverLetterPage: React.FC = () => {
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [activeLetter, setActiveLetter] = useState<any | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
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

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setStatusMsg(null);
      const res = await apiClient.post('/cover-letters/generate', {
        opportunityId: selectedOpportunityId || undefined,
      });

      if (res.data.success && res.data.coverLetter) {
        setStatusMsg('New German Anschreiben generated from profile and opportunity requirements!');
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
        setStatusMsg('Changes saved successfully!');
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
            German Anschreiben Generator (DIN 5008)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Creates tailored German cover letters matching target universities and employers, formatted with formal German etiquette (Betreff, Anrede, Grußformel).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={selectedOpportunityId}
            onChange={(e) => setSelectedOpportunityId(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.82rem',
              maxWidth: '260px',
            }}
          >
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} ({o.organization})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.6rem 1.25rem' }}
          >
            {generating ? <RefreshCw className="animate-spin" size={15} /> : <Sparkles size={15} />}
            <span>Generate Anschreiben</span>
          </button>
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
      ) : activeLetter ? (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Letter History & Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Saved Letters ({coverLetters.length})
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
                      padding: '0.6rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeLetter?.id === cl.id ? '#3b82f6' : 'var(--border-subtle)',
                      background: activeLetter?.id === cl.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: activeLetter?.id === cl.id ? '#fff' : '#cbd5e1',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{cl.title || 'Anschreiben'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {new Date(cl.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                Document Title
              </label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Copy size={14} />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Letter View & Direct Editor */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '2.5rem',
              borderRadius: '8px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                {letterTitle || 'Bewerbungsschreiben'}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                DIN 5008 Konform &bull; Deutsch (Formal)
              </div>
            </div>

            <textarea
              rows={22}
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '1.25rem',
                fontSize: '0.88rem',
                lineHeight: '1.7',
                color: '#1e293b',
                background: '#fafafa',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <FileEdit size={40} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
            No German Cover Letters Created
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Select an opportunity above and generate a personalized German Anschreiben highlighting your credentials and motivation.
          </p>
          <button onClick={handleGenerate} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Generate Cover Letter
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverLetterPage;
