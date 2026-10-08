import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  Clock,
  Layers,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  GraduationCap,
  Award,
  ArrowRight,
  ExternalLink,
  Check,
} from 'lucide-react';
import { NextStepRecommendation, EducaroService } from '../types';

export const NextStepPage: React.FC = () => {
  const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
  const [services, setServices] = useState<EducaroService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, srvRes] = await Promise.allSettled([
        apiClient.get('/recommendations/next-step'),
        apiClient.get('/recommendations/services'),
      ]);

      if (recRes.status === 'fulfilled' && recRes.value.data.success) {
        setRecommendation(recRes.value.data.recommendation);
      }
      if (srvRes.status === 'fulfilled' && srvRes.value.data.success) {
        setServices(srvRes.value.data.services || []);
      }
    } catch (err) {
      console.error('Failed to load next-step data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setActionMsg(null);
      const res = await apiClient.post('/recommendations/refresh');
      if (res.data.success) {
        setRecommendation(res.data.recommendation);
        setActionMsg('Recommendation refreshed based on latest dossier state!');
      }
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || 'Failed to refresh recommendation.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await apiClient.post(`/recommendations/${id}/accept`);
      if (res.data.success) {
        setRecommendation(res.data.recommendation);
        setActionMsg('Recommendation accepted! An Educaro advisor will reach out shortly.');
      }
    } catch (err) {
      alert('Failed to accept recommendation.');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const res = await apiClient.post(`/recommendations/${id}/dismiss`);
      if (res.data.success) {
        setRecommendation(res.data.recommendation);
        setActionMsg('Recommendation dismissed.');
      }
    } catch (err) {
      alert('Failed to dismiss recommendation.');
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
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                color: '#60a5fa',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              EDUCARO DEUTSCHLAND ECOSYSTEM
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Deterministic Routing Architecture
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Next Recommended Step & Official Pathways
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '720px', lineHeight: 1.55 }}>
            Identified qualification gaps are deterministically mapped to verified Educaro preparation packages. Ensures applicants take the highest-impact action at the exact right moment.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.35rem',
            fontSize: '0.88rem',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
          }}
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} size={15} />
          <span>{refreshing ? 'Re-Evaluating Routing...' : 'Re-Evaluate Routing'}</span>
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

      {/* 2. Primary Recommendation Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Analyzing qualification dossier for optimal next action...</p>
        </div>
      ) : recommendation ? (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '1.75rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ACTIVE PATHWAY ACTION
                </span>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Category: <strong style={{ color: '#fff' }}>{recommendation.type.replace(/_/g, ' ')}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  background:
                    recommendation.status === 'ACCEPTED'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                  color: recommendation.status === 'ACCEPTED' ? '#34d399' : '#60a5fa',
                  fontWeight: 600,
                }}
              >
                Status: {recommendation.status}
              </span>
              {recommendation.confidence && (
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {Math.round(recommendation.confidence * 100)}% rule confidence
                </span>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.65rem' }}>
            {recommendation.title}
          </h2>
          <p style={{ fontSize: '0.94rem', color: '#cbd5e1', lineHeight: '1.65', marginBottom: '1.25rem' }}>
            {recommendation.reason}
          </p>

          {/* Supporting Evidence Container */}
          <div
            style={{
              background: 'rgba(11, 17, 32, 0.75)',
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Deterministic Rule Rationale:</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              {recommendation.supportingEvidence?.ruleDescription ||
                recommendation.supportingEvidence?.remediationAction ||
                'Candidate satisfies initial education criteria but requires Goethe B1 certification for German vocational school admission.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {recommendation.status !== 'ACCEPTED' && (
              <button
                onClick={() => handleAccept(recommendation.id)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.7rem 1.6rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Check size={16} />
                <span>Accept Recommendation</span>
              </button>
            )}
            {recommendation.status !== 'DISMISSED' && (
              <button
                onClick={() => handleDismiss(recommendation.id)}
                className="btn"
                style={{
                  padding: '0.7rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Sparkles size={38} color="#60a5fa" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            No Active Recommendation Computed
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            Complete your profile intake and upload your transcripts to generate targeted next steps.
          </p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Compute Recommendations
          </button>
        </div>
      )}

      {/* 3. Official Educaro Services Catalog */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#60a5fa" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Educaro Deutschland Service Solutions
              </h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Official preparation academies, credential evaluation packages, and dual Ausbildung placements
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
            Official Educaro Partner Network
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {services.map((srv) => (
            <div
              key={srv.id}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {srv.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(37, 99, 235, 0.15)',
                      color: '#60a5fa',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {srv.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 1rem 0' }}>
                  {srv.description}
                </p>

                {srv.benefits && srv.benefits.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                    {srv.benefits.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                        <Check size={13} color="#34d399" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {srv.duration && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Duration: <strong style={{ color: '#cbd5e1' }}>{srv.duration}</strong>
                    </div>
                  )}
                  {srv.fee && (
                    <div style={{ fontSize: '0.76rem', color: '#60a5fa', fontWeight: 700 }}>
                      {srv.fee}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => alert(`Connecting you to Educaro enrollment for: ${srv.title}`)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  Explore Program
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NextStepPage;
