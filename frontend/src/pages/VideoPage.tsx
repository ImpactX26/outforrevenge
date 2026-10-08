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
  Award,
  Mic,
  Check,
  ArrowRight,
  MessageSquare,
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
        setStatusMsg(`Video "${file.name}" uploaded successfully! Analyzing spoken transcript...`);
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
      setStatusMsg('Running Whisper STT transcription and communication clarity analysis...');
      const res = await apiClient.post(`/videos/${id}/analyze`);
      if (res.data.success) {
        setStatusMsg('Video successfully analyzed and communication profile generated!');
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
                background: 'rgba(167, 139, 250, 0.15)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                color: '#a78bfa',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              WHISPER STT • 60S COMMUNICATION PROFILE
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Spoken Fluency & Motivation Analysis
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            60-Second Video Introduction Studio
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '720px', lineHeight: 1.55 }}>
            Deliver a concise 60-second elevator pitch explaining your background and Germany relocation intent. Nexora transcribes speech, evaluates communication clarity, and requires your explicit approval before updating your profile.
          </p>
        </div>

        <button
          onClick={fetchVideos}
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
          <span>Refresh</span>
        </button>
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

      {/* 2. Upload / Record Video Dropzone */}
      <div
        className="card"
        style={{
          border: '2px dashed rgba(167, 139, 250, 0.35)',
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
          onChange={handleVideoUpload}
          accept="video/*,audio/*"
        />
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(167, 139, 250, 0.15)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            margin: '0 auto 1.25rem',
          }}
        >
          {uploading ? <RefreshCw className="animate-spin" size={26} /> : <Video size={26} />}
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem' }}>
          {uploading ? 'Uploading Video & Initiating Transcription...' : 'Upload Your 60-Second Video Intro'}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.84rem', maxWidth: '520px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
          Record in English or German. Share: (1) Your educational background, (2) Why Germany, and (3) Your career goal (Study, Ausbildung, or Tech job). MP4, WebM, or MOV up to 50MB.
        </p>

        <button
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.55rem 1.25rem' }}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <Upload size={15} />
          <span>Select Video File</span>
        </button>
      </div>

      {/* 3. Processed Video Dossier Feed */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Submitted Video Introductions ({videos.length})
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Transcribed via Whisper speech-to-text with provenance tracking
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <RefreshCw className="animate-spin" size={26} color="#3b82f6" />
          </div>
        ) : videos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {videos.map((vid) => (
              <div
                key={vid.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(167, 139, 250, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a78bfa',
                      }}
                    >
                      <Video size={18} />
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>
                        {vid.filename}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {vid.durationSeconds ? `${vid.durationSeconds}s duration` : 'Standard Duration'} &bull; Status:{' '}
                        <span style={{ color: vid.status === 'COMPLETED' ? '#34d399' : '#60a5fa' }}>{vid.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {vid.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleAnalyze(vid.id)}
                        disabled={analyzingId === vid.id}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {analyzingId === vid.id ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
                        <span>Analyze Video</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Spoken Transcript Block */}
                {vid.transcript && (
                  <div
                    style={{
                      background: '#090d16',
                      borderRadius: '8px',
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mic size={13} color="#60a5fa" />
                      <span>Whisper STT Spoken Transcript:</span>
                    </div>
                    <p style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                      "{vid.transcript}"
                    </p>
                  </div>
                )}

                {/* Analysis & Extracted Synthesis */}
                {vid.analysis && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                        Communication Profile Synthesis
                      </span>
                      {vid.analysis.confidence && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Confidence: {Math.round(vid.analysis.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {vid.analysis.backgroundSummary && (
                      <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                        <strong style={{ color: '#fff' }}>Background:</strong> {vid.analysis.backgroundSummary}
                      </div>
                    )}

                    {vid.analysis.germanyMotivation && (
                      <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                        <strong style={{ color: '#fff' }}>Germany Intent:</strong> {vid.analysis.germanyMotivation}
                      </div>
                    )}

                    {vid.analysis.relevantSkills && vid.analysis.relevantSkills.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Detected Strengths:</strong>
                        {vid.analysis.relevantSkills.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.55rem',
                              background: 'rgba(37, 99, 235, 0.2)',
                              color: '#93c5fd',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Applicant Approval Action */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Provenance: <strong style={{ color: '#a78bfa' }}>VIDEO_EXTRACTED</strong> (Requires Approval)
                      </span>

                      {vid.analysis.applicantApproved ? (
                        <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Check size={14} />
                          <span>Approved & Integrated into Dossier</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(vid.id)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}
                        >
                          Approve Profile Update
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            No video introductions uploaded yet. Record a 60-second clip to enhance your credential dossier.
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
