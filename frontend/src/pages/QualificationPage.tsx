import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { QualificationAssessment, QualificationStatus } from '../types';

export const QualificationPage: React.FC = () => {
  const [assessment, setAssessment] = useState<QualificationAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/qualification/current');
      if (res.data.success) {
        setAssessment(res.data.assessment);
      }
    } catch (err) {
      console.error('Failed to load qualification assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, []);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      setMsg(null);
      const res = await apiClient.post('/qualification/evaluate');
      if (res.data.success) {
        setAssessment(res.data.assessment);
        setMsg('Assessment evaluated against German immigration & academic rules!');
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Evaluation encountered an issue.');
    } finally {
      setEvaluating(false);
    }
  };

  const getStatusBadge = (status?: QualificationStatus) => {
    switch (status) {
      case 'QUALIFIED':
        return <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>DIRECT QUALIFIED</span>;
      case 'PARTIALLY_QUALIFIED':
        return <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>PARTIALLY QUALIFIED</span>;
      case 'MORE_INFORMATION_REQUIRED':
        return <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>INFO REQUIRED</span>;
      case 'NOT_CURRENTLY_QUALIFIED':
        return <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>NOT CURRENTLY QUALIFIED</span>;
      default:
        return <span className="badge badge-secondary">PENDING EVALUATION</span>;
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
            Deterministic Qualification Engine
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Rules are grounded in the German Federal Recognition Act (Anerkennungsgesetz), KMK Anabin criteria, and university entrance regulations. AI provides explanatory synthesis over deterministic rule proof.
          </p>
        </div>
        <button
          onClick={handleEvaluate}
          disabled={evaluating}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          {evaluating ? <RefreshCw className="animate-spin" size={17} /> : <Sparkles size={17} />}
          <span>{evaluating ? 'Running Rules...' : 'Re-Evaluate Dossier'}</span>
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            fontSize: '0.85rem',
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
        </div>
      ) : assessment ? (
        <>
          {/* Status & Readiness Score Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Overall Qualification Status
              </div>
              <div>{getStatusBadge(assessment.status)}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
                Evaluated at: {new Date(assessment.evaluatedAt).toLocaleString()}
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Readiness Score
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                  {assessment.score} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
                </div>
              </div>
              <div className="progress-bar-container" style={{ height: '8px', margin: '0.75rem 0' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${assessment.score}%`,
                    background: assessment.score >= 75 ? '#10b981' : assessment.score >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Deterministic score calculated across 8 key pathway criteria.
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Satisfied vs Missing
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                    {assessment.satisfiedRequirements?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Satisfied Rules</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                    {assessment.missingRequirements?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gaps to Remediate</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation Card */}
          {assessment.aiExplanation && (
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Sparkles size={18} color="#60a5fa" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  German Pathway Explanation
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                {assessment.aiExplanation}
              </p>
            </div>
          )}

          {/* Satisfied Requirements List */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={18} color="#10b981" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Satisfied Requirements ({assessment.satisfiedRequirements?.length || 0})
              </h2>
            </div>

            {assessment.satisfiedRequirements && assessment.satisfiedRequirements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assessment.satisfiedRequirements.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Rule Code: <code style={{ color: '#38bdf8' }}>{r.ruleCode}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        Verified Evidence
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                        {r.evidence}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                No requirements satisfied yet. Add credentials to your dossier.
              </div>
            )}
          </div>

          {/* Missing Requirements List & Remediation */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Missing Requirements & Remediation Steps ({assessment.missingRequirements?.length || 0})
              </h2>
            </div>

            {assessment.missingRequirements && assessment.missingRequirements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assessment.missingRequirements.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Rule Code: <code style={{ color: '#fbbf24' }}>{r.ruleCode}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', maxWidth: '400px' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                        Remediation Action
                      </span>
                      <div style={{ fontSize: '0.8rem', color: '#fde68a', marginTop: '0.2rem', lineHeight: '1.4' }}>
                        {r.remediationAction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#10b981', fontSize: '0.85rem' }}>
                All pathway requirements are currently met! You are ready for application submission.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Award size={36} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
            No Qualification Assessment Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Click the button below to run the deterministic evaluation engine on your profile credentials and uploaded documents.
          </p>
          <button onClick={handleEvaluate} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Run Assessment Now
          </button>
        </div>
      )}
    </div>
  );
};

export default QualificationPage;
