import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  FileText,
  Building2,
  GraduationCap,
  Scale,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { QualificationAssessment, QualificationStatus } from '../types';

export const QualificationPage: React.FC = () => {
  const navigate = useNavigate();
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
        setMsg('Dossier successfully evaluated against German statutory requirements.');
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
        return (
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              letterSpacing: '0.04em',
            }}
          >
            DIRECT QUALIFIED
          </span>
        );
      case 'PARTIALLY_QUALIFIED':
        return (
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
              letterSpacing: '0.04em',
            }}
          >
            PARTIALLY QUALIFIED
          </span>
        );
      case 'MORE_INFORMATION_REQUIRED':
        return (
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60a5fa',
              letterSpacing: '0.04em',
            }}
          >
            INFORMATION REQUIRED
          </span>
        );
      case 'NOT_CURRENTLY_QUALIFIED':
        return (
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              letterSpacing: '0.04em',
            }}
          >
            NOT CURRENTLY QUALIFIED
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(148, 163, 184, 0.15)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#94a3b8',
              letterSpacing: '0.04em',
            }}
          >
            PENDING EVALUATION
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Authoritative Regulatory Header Banner */}
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
              BUNDESRECHT & KMK ANABIN COMPLIANCE
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Statutory Anerkennungsgesetz Evaluation
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Deterministic Qualification Assessment
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '720px', lineHeight: 1.55 }}>
            Automated verification against entrance regulations for German Universities, Dual Ausbildung (BBiG), and the Skilled Immigration Act (FEG). AI provides explanatory synthesis over deterministic proof.
          </p>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={evaluating}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.4rem',
            fontSize: '0.88rem',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
          }}
        >
          <RefreshCw className={evaluating ? 'animate-spin' : ''} size={16} />
          <span>{evaluating ? 'Evaluating Statutory Rules...' : 'Re-Evaluate Dossier'}</span>
        </button>
      </div>

      {msg && (
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
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Evaluating credentials against German criteria...</p>
        </div>
      ) : assessment ? (
        <>
          {/* 2. Executive Metric Scorecards (4 Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div
              className="card"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Statutory Evaluation
                </div>
                <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  {getStatusBadge(assessment.status)}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Evaluated: {new Date(assessment.evaluatedAt).toLocaleDateString()} at {new Date(assessment.evaluatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div
              className="card"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Readiness Score
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                  {assessment.score} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/ 100</span>
                </div>
              </div>
              <div className="progress-bar-container" style={{ height: '6px', margin: '0.75rem 0', background: 'rgba(255, 255, 255, 0.08)' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${assessment.score}%`,
                    background: assessment.score >= 75 ? '#10b981' : assessment.score >= 50 ? '#f59e0b' : '#3b82f6',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Computed across 8 core German statutory pathway rules.
              </div>
            </div>

            <div
              className="card"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.35rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Rule Verification Summary
              </div>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
                    {assessment.satisfiedRequirements?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Verified Satisfied</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
                    {assessment.missingRequirements?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Gaps to Remediate</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Official Pathway Analysis & Synthesis Card */}
          {assessment.aiExplanation && (
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Scale size={18} color="#60a5fa" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Statutory Pathway Explanation
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.65' }}>
                {assessment.aiExplanation}
              </p>
            </div>
          )}

          {/* 4. Verified Satisfied Requirements */}
          <div
            className="card"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#34d399" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Satisfied Statutory Requirements ({assessment.satisfiedRequirements?.length || 0})
                </h2>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
                Validated against uploaded dossier evidence
              </span>
            </div>

            {assessment.satisfiedRequirements && assessment.satisfiedRequirements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {assessment.satisfiedRequirements.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.04)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Regulatory Code: <code style={{ color: '#60a5fa' }}>{r.ruleCode}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', maxWidth: '420px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          fontWeight: 700,
                        }}
                      >
                        VERIFIED EVIDENCE
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.25rem', lineHeight: 1.4 }}>
                        {r.evidence}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                No requirements satisfied yet. Upload academic transcripts and degree marksheets.
              </div>
            )}
          </div>

          {/* 5. Missing Requirements & Direct Remediation Roadmap */}
          <div
            className="card"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#fbbf24" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Missing Requirements & Remediation Steps ({assessment.missingRequirements?.length || 0})
                </h2>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 600 }}>
                Mandatory before official visa application
              </span>
            </div>

            {assessment.missingRequirements && assessment.missingRequirements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {assessment.missingRequirements.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.04)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Statutory Criterion: <code style={{ color: '#fbbf24' }}>{r.ruleCode}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', maxWidth: '440px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          fontWeight: 700,
                        }}
                      >
                        REMEDIATION ACTION
                      </span>
                      <div style={{ fontSize: '0.82rem', color: '#fde68a', marginTop: '0.25rem', lineHeight: '1.45' }}>
                        {r.remediationAction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#34d399', fontSize: '0.88rem' }}>
                All mandatory statutory requirements for your pathway are currently met!
              </div>
            )}
          </div>

          {/* 6. Statutory Pathway Privileges: German University Option & Video Interview */}
          <div
            className="card"
            style={{
              padding: '1.6rem 1.85rem',
              background: assessment.status === 'QUALIFIED'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(30, 41, 59, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: assessment.status === 'QUALIFIED'
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <GraduationCap size={20} color={assessment.status === 'QUALIFIED' ? '#34d399' : '#fbbf24'} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Statutory Pathway Clearance: German Higher Education & Dual Vocational Opportunities
                  </h3>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, maxWidth: '780px', lineHeight: 1.55 }}>
                  {assessment.status === 'QUALIFIED'
                    ? 'Under German KMK higher education regulations and the Skilled Immigration Act (FEG), your verified credentials grant direct German University Study eligibility and opportunity application clearance across verified German partner institutions.'
                    : 'German University Study options and dual vocational training applications are unlocked strictly upon achieving verified QUALIFIED status. Satisfy remaining language and transcript requirements to unlock.'}
                </p>
              </div>

              <span
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: assessment.status === 'QUALIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: assessment.status === 'QUALIFIED' ? '#34d399' : '#fbbf24',
                  border: assessment.status === 'QUALIFIED' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  letterSpacing: '0.04em',
                }}
              >
                {assessment.status === 'QUALIFIED' ? 'PRIVILEGES UNLOCKED' : 'QUALIFICATION REQUIRED'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
              {/* University Option Box */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '1.1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <GraduationCap size={16} color="#60a5fa" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>German University Option</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    {assessment.status === 'QUALIFIED'
                      ? 'Apply to top public tuition-free German universities (TUM, RWTH Aachen) with verified Anabin comparability & APS compliance.'
                      : 'University applications require direct Anabin H+ comparability and language prerequisites.'}
                  </p>
                </div>
                <div>
                  {assessment.status === 'QUALIFIED' ? (
                    <button
                      onClick={() => navigate('/opportunities?filter=STUDY')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', width: '100%', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    >
                      <span>Explore University Study Programs</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>
                      Locked until QUALIFIED status is achieved
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Vocational & Skilled Pathway Box */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '1.1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <Briefcase size={16} color="#34d399" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Dual Vocational & Skilled Opportunities</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    {assessment.status === 'QUALIFIED'
                      ? 'Clearance granted to browse dual Ausbildung programs and employer opportunities, prepare official application packages, and receive interview invitations.'
                      : 'Dual vocational training and skilled employment options require verified qualification evaluation.'}
                  </p>
                </div>
                <div>
                  {assessment.status === 'QUALIFIED' ? (
                    <button
                      onClick={() => navigate('/opportunities')}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', width: '100%', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)' }}
                    >
                      <Briefcase size={14} />
                      <span>Browse German Opportunities</span>
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>
                      Locked until QUALIFIED status is achieved
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Educaro Action Bridge Banner */}
          <div
            className="card"
            style={{
              padding: '1.5rem 1.75rem',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                Ready to bridge your qualification gaps?
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Educaro Deutschland provides verified language academies and credential recognition packages tailored to these findings.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={() => navigate('/next-step')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.35rem' }}
              >
                <span>View Educaro Solutions</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Award size={42} color="#60a5fa" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            No Qualification Evaluation Computed Yet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Upload your academic transcripts or trigger an automated evaluation against statutory German regulations.
          </p>
          <button onClick={handleEvaluate} className="btn btn-primary">
            Run Initial Evaluation
          </button>
        </div>
      )}
    </div>
  );
};

export default QualificationPage;
