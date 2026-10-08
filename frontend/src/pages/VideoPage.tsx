import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../api/client';
import {
  Video,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { VideoItem } from '../types';

export const VideoPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/videos');
      if (res.data.success) {
        setVideos(res.data.videos || []);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setStatusMsg(null);
      const formData = new FormData();
      formData.append('video', file);

      const res = await apiClient.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setStatusMsg(`Video "${file.name}" uploaded successfully! Analyzing transcript...`);
        await fetchVideos();
      }
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to upload video.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (id: string) => {
    try {
      setAnalyzingId(id);
      setStatusMsg('Running Speech-to-Text transcription and AI synthesis...');
      const res = await apiClient.post(`/videos/${id}/analyze`);
      if (res.data.success) {
        setStatusMsg('Video successfully analyzed and insights generated!');
        await fetchVideos();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Video analysis failed.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiClient.post(`/videos/${id}/approve`);
      if (res.data.success) {
        setStatusMsg('Video insights approved and integrated into your official profile dossier!');
        await fetchVideos();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve insights.');
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
            60-Second Video Introduction & STT
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Record or upload a 60-second video elevator pitch explaining your background and Germany relocation intent. Nexora transcribes speech, extracts skills, and requires your explicit approval before updating your profile.
          </p>
        </div>
        <button
          onClick={fetchVideos}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
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

      {/* Upload Zone */}
      <div
        className="card"
        style={{
          border: '2px dashed rgba(168, 85, 247, 0.4)',
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
          onChange={handleVideoUpload}
          accept="video/mp4,video/webm,video/quicktime,video/mkv"
        />
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc',
            margin: '0 auto 1rem',
          }}
        >
          {uploading ? <RefreshCw className="animate-spin" size={26} /> : <Video size={26} />}
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
          {uploading ? 'Uploading Video...' : 'Upload 60-Second Video Pitch'}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: '500px', margin: '0 auto' }}>
          Supports MP4, WebM, and MOV up to 100MB. State-of-the-art speech transcription models process German & English.
        </p>
      </div>

      {/* Video Dossier List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <RefreshCw className="animate-spin" size={26} color="#a855f7" />
          </div>
        ) : videos.length > 0 ? (
          videos.map((vid) => (
            <div key={vid.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Video size={20} color="#c084fc" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {vid.filename}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Status: <strong style={{ color: '#fff' }}>{vid.status}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {vid.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleAnalyze(vid.id)}
                      disabled={analyzingId === vid.id}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {analyzingId === vid.id ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      <span>Trigger STT & AI</span>
                    </button>
                  )}
                  {vid.analysis && !vid.analysis.applicantApproved && (
                    <button
                      onClick={() => handleApprove(vid.id)}
                      className="btn btn-success"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#10b981', color: '#fff' }}
                    >
                      <ShieldCheck size={15} />
                      <span>Approve for Dossier</span>
                    </button>
                  )}
                  {vid.analysis?.applicantApproved && (
                    <span className="badge badge-success">
                      Approved & Integrated
                    </span>
                  )}
                </div>
              </div>

              {/* Transcript Block */}
              {vid.transcript && (
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FileText size={16} color="#60a5fa" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Speech-to-Text Transcript
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{vid.transcript}"
                  </p>
                </div>
              )}

              {/* Analysis Cards */}
              {vid.analysis && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Background Summary
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {vid.analysis.backgroundSummary || 'Extracted summary from candidate monologue.'}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Germany Motivation
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {vid.analysis.germanyMotivation || 'Clear intent to relocate to Germany for career growth.'}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Recognized Skills
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                      {vid.analysis.relevantSkills?.map((s, idx) => (
                        <span key={idx} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      )) || <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None identified</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 0', color: '#94a3b8' }}>
            No video introductions uploaded yet. Record a quick 60s introduction to boost your profile score.
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
