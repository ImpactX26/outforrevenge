import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  ArrowRightCircle,
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
            Next Recommended Step & Educaro Routing
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Determined through deterministic routing rules. Ensures applicants are guided to certified Educaro services or escalated to human advisors at the exact right moment.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
        >
          {refreshing ? <RefreshCw className="animate-spin" size={15} /> : <Sparkles size={15} />}
          <span>Re-Evaluate Routing</span>
        </button>
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

      {/* Primary Recommendation Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
        </div>
      ) : recommendation ? (
        <div
          className="card"
          style={{
            border: '2px solid rgba(59, 130, 246, 0.5)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={22} color="#60a5fa" />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#60a5fa',
                }}
              >
                Active Pathway Recommendation
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-primary">
                {recommendation.type.replace('_', ' ')}
              </span>
              <span
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
                  fontWeight: 600,
                }}
              >
                Status: {recommendation.status}
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem' }}>
            {recommendation.title}
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 1.25rem' }}>
            {recommendation.reason}
          </p>

          {/* Rule Evidence / Supporting Data */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
              Deterministic Rule Basis & Trigger Evidence
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.5' }}>
              {recommendation.supportingEvidence?.ruleDescription ||
                recommendation.supportingEvidence?.remediationAction ||
                'Triggered by profile readiness evaluation logic.'}
            </div>
            {recommendation.confidence && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                Rule Confidence: {Math.round(recommendation.confidence * 100)}%
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {recommendation.status !== 'ACCEPTED' && (
              <button
                onClick={() => handleAccept(recommendation.id)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.5rem' }}
              >
                <CheckCircle2 size={16} />
                <span>Accept Recommendation</span>
              </button>
            )}

            {recommendation.status !== 'DISMISSED' && (
              <button
                onClick={() => handleDismiss(recommendation.id)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
              >
                <XCircle size={16} />
                <span>Dismiss</span>
              </button>
            )}

            <button
              onClick={() => alert('An inquiry has been routed to your assigned Educaro consultant.')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
            >
              <MessageSquare size={16} />
              <span>Ask Consultant</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
          No recommendations computed yet. Complete your profile and run the qualification check.
        </div>
      )}

      {/* Educaro Services Catalog */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Official Educaro Deutschland Services Catalog
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            End-to-end relocation and qualification packages backed by German university partners and accredited institutions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {services.map((srv) => (
            <div
              key={srv.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(37, 99, 235, 0.15)',
                      color: '#60a5fa',
                      fontWeight: 700,
                    }}
                  >
                    {srv.category}
                  </span>
                  {srv.duration && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} />
                      <span>{srv.duration}</span>
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
                  {srv.title}
                </h3>

                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 0.85rem' }}>
                  {srv.description}
                </p>

                {srv.benefits && srv.benefits.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    {srv.benefits.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {srv.fee || 'Consultation Included'}
                </span>
                <button
                  onClick={() => alert(`Inquiry initiated for ${srv.title}. An Educaro advisor will confirm next steps.`)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  Inquire Service
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
