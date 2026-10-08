import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import {
  Bot,
  Award,
  Briefcase,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  MapPin,
  Building2,
  Map,
  GraduationCap,
  Lock,
  FileCheck2,
  Check,
  ChevronRight,
  Video,
} from 'lucide-react';
import {
  ApplicantProfile,
  NextStepRecommendation,
  OpportunityMatch,
  QualificationAssessment,
  Journey,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [nextStep, setNextStep] = useState<NextStepRecommendation | null>(null);
  const [assessment, setAssessment] = useState<QualificationAssessment | null>(null);
  const [opportunityMatches, setOpportunityMatches] = useState<OpportunityMatch[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, nextStepRes, qualRes, oppRes, journeyRes] = await Promise.allSettled([
        apiClient.get('/applicant/profile'),
        apiClient.get('/recommendations/next-step'),
        apiClient.get('/qualification/latest'),
        apiClient.get('/opportunities/matches'),
        apiClient.get('/journey'),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
        setProfile(profileRes.value.data.profile);
      }
      if (nextStepRes.status === 'fulfilled' && nextStepRes.value.data.success) {
        setNextStep(nextStepRes.value.data.recommendation);
      }
      if (qualRes.status === 'fulfilled' && qualRes.value.data.success) {
        setAssessment(qualRes.value.data.assessment);
      }
      if (oppRes.status === 'fulfilled' && oppRes.value.data.success) {
        setOpportunityMatches(oppRes.value.data.matches?.slice(0, 3) || []);
      }
      if (journeyRes.status === 'fulfilled' && journeyRes.value.data.success) {
        setJourney(journeyRes.value.data.journey);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'QUALIFIED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
            }}
          >
            Direct Qualified
          </span>
        );
      case 'PARTIALLY_QUALIFIED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
            }}
          >
            Partially Qualified
          </span>
        );
      case 'MORE_INFORMATION_REQUIRED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
            }}
          >
            Info Required
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(148, 163, 184, 0.15)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#94a3b8',
            }}
          >
            Pending Evaluation
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={34} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading your Nexora relocation dossier...</p>
        </div>
      </div>
    );
  }

  const completeness = profile?.profileCompleteness ? profile.profileCompleteness : (profile ? (Boolean(profile.phone || profile.location) ? 20 : 0) + (Boolean(profile.educations?.length) ? 20 : 0) + (Boolean(profile.skills?.length) ? 20 : 0) + (Boolean(profile.languages?.length) ? 20 : 0) : 0);
  const readiness = assessment ? assessment.score : null;
  const currentGoal = profile?.currentGoal || 'AUSBILDUNG';

  const goalTitle =
    currentGoal === 'STUDY'
      ? 'Higher Education (Study)'
      : currentGoal === 'AUSBILDUNG'
      ? 'Dual Vocational Training (Ausbildung)'
      : 'Skilled Employment (Fachkraft)';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Executive Welcome Header (Problem-Statement Aligned) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
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
              🇩🇪 GERMANY RELOCATION DOSSIER
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              Target: {goalTitle}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Willkommen zurück, {user?.firstName || 'Applicant'}!
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            Your credential profile is evaluated against the German Federal Recognition Act (<em>Anerkennungsgesetz</em>) and KMK Anabin equivalence standards.
          </p>
        </div>

        {/* Problem-Statement Focused Navigation CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/applications')}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.88rem',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Briefcase size={17} />
            <span>My Applications</span>
          </button>
          <button
            onClick={() => navigate('/assistant')}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.88rem',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Bot size={17} />
            <span>Ask AI Advisor</span>
          </button>

          <button
            onClick={() => navigate('/journey')}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.88rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
            }}
          >
            <Map size={17} />
            <span>My Roadmap</span>
          </button>
        </div>
      </div>

      {/* 2. Key Executive Metrics Grid (4 Sleek Status Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* Metric 1: Readiness Score */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.35rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Germany Readiness
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {assessment ? <>{assessment.score} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/ 100</span></> : <>? <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/ 100</span></>}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="progress-bar-container" style={{ height: '6px', marginBottom: '0.75rem', background: 'rgba(255, 255, 255, 0.08)' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: assessment ? (assessment.score + '%') : '0%',
                background: assessment && assessment.score >= 70 ? '#10b981' : '#f59e0b',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Evaluation:</span>
            {getStatusBadge(assessment?.status)}
          </div>
        </div>

        {/* Metric 2: Dossier Completeness */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.35rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Dossier Completeness
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {completeness}%
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="progress-bar-container" style={{ height: '6px', marginBottom: '0.75rem', background: 'rgba(255, 255, 255, 0.08)' }}>
            <div className="progress-bar-fill" style={{ width: `${completeness}%`, background: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Credential Status:</span>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
              {completeness >= 60 ? 'Verified OCR' : 'Pending Uploads'}
            </span>
          </div>
        </div>

        {/* Metric 3: German Language Level */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.35rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                German Language Level
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
                {profile?.germanLevel || 'Not provided'}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
              }}
            >
              <GraduationCap size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
            Target: <strong style={{ color: '#fff' }}>B1 Certificate</strong> for {goalTitle}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Remediation:</span>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
              Educaro Fast-Track
            </span>
          </div>
        </div>

        {/* Metric 4: Academic Equivalence */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.35rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Anabin & APS Recognition
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
                {profile?.anabinStatus || 'Pending Verification'}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <Award size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
            Bavarian GPA: <strong style={{ color: '#fff' }}>{profile?.bavarianGpa ? (profile.bavarianGpa + ' (German Scale)') : 'Not evaluated'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Equivalence:</span>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
              Recognized in Germany
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive 7-Step Journey Roadmap Pipeline (Problem Statement Core) */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map size={18} color="#60a5fa" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Your 7-Stage Relocation Roadmap
              </h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Sequential milestone progress to complete your German visa and enrollment dossier
            </div>
          </div>
          <Link
            to="/journey"
            style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <span>View Full Journey</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {/* 7-Step Progress Track */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {[
            { step: 1, code: 'PROFILE', title: 'Profile Intake', path: '/profile', status: 'COMPLETED' },
            { step: 2, code: 'DOCUMENTS', title: 'Document OCR', path: '/documents', status: profile?.documents?.length ? 'COMPLETED' : 'IN_PROGRESS' },
            { step: 3, code: 'VIDEO', title: '60s Video Pitch', path: '/video', status: profile?.videoIntroductions?.length ? 'COMPLETED' : 'PENDING' },
            { step: 4, code: 'QUALIFICATION', title: 'Qualification Check', path: '/qualification', status: assessment ? 'COMPLETED' : 'IN_PROGRESS' },
            { step: 5, code: 'RECOMMENDATIONS', title: 'Educaro Next Step', path: '/next-step', status: nextStep ? 'IN_PROGRESS' : 'PENDING' },
            { step: 6, code: 'CV_BUILDER', title: 'Lebenslauf (DIN 5008)', path: '/cv', status: 'PENDING' },
            { step: 7, code: 'SUBMISSION', title: 'Visa Preparation', path: '/journey', status: 'LOCKED' },
          ].map((s) => {
            const isCompleted = s.status === 'COMPLETED';
            const isInProgress = s.status === 'IN_PROGRESS';
            const isLocked = s.status === 'LOCKED';

            return (
              <div
                key={s.step}
                onClick={() => !isLocked && navigate(s.path)}
                style={{
                  background: isInProgress
                    ? 'rgba(37, 99, 235, 0.15)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(30, 41, 59, 0.4)',
                  border: isInProgress
                    ? '1px solid rgba(59, 130, 246, 0.5)'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '0.85rem 0.75rem',
                  cursor: isLocked ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: isInProgress ? '#60a5fa' : isCompleted ? '#34d399' : '#64748b',
                    }}
                  >
                    STEP {s.step}
                  </span>
                  {isCompleted ? (
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                      <Check size={12} />
                    </span>
                  ) : isInProgress ? (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }} />
                  ) : (
                    <Lock size={12} color="#64748b" />
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isInProgress ? '#fff' : '#cbd5e1', lineHeight: 1.3 }}>
                  {s.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Recommended Next Step (Educaro Focused - Central to Hackathon Problem Statement) */}
      <div
        className="card"
        style={{
          border: '1px solid rgba(59, 130, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          padding: '1.75rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles size={17} />
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: '#60a5fa', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                HIGHEST-IMPACT ACTION
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Next Recommended Step with Educaro
              </h2>
            </div>
          </div>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              color: '#93c5fd',
            }}
          >
            {nextStep?.type === 'EDUCARO_SERVICE'
              ? 'Official Educaro Academy'
              : nextStep?.type === 'CONSULTANT_REFERRAL'
              ? 'Human Consultant Escalation'
              : 'Applicant Remediation'}
          </span>
        </div>

        {nextStep ? (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.65rem' }}>
              {nextStep.title}
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.65', marginBottom: '1.25rem' }}>
              {nextStep.reason}
            </p>

            {/* Supporting Deterministic Evidence */}
            <div
              style={{
                background: 'rgba(11, 17, 32, 0.75)',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="#34d399" />
                <span>Deterministic Evidence Basis:</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {nextStep.supportingEvidence?.ruleDescription ||
                  nextStep.supportingEvidence?.remediationAction ||
                  'Your profile satisfies educational prerequisites, but requires German B1 certification to unlock vocational school applications.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/next-step')}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.92rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                }}
              >
                <span>Proceed with Educaro Step</span>
                <ArrowRight size={17} />
              </button>
              <button
                onClick={() => navigate('/qualification')}
                className="btn"
                style={{
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.92rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                }}
              >
                View Qualification Breakdown
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Upload your degree transcripts to compute your personalized Educaro next action.
            </p>
            <button
              onClick={() => navigate('/documents')}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              Upload Transcripts & Certificates
            </button>
          </div>
        )}
      </div>

      {/* 5. Core Application Modules Grid (Only Problem Statement Tools) */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          Core Relocation Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <Link
            to="/documents"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Document Intelligence & OCR</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Upload Indian transcripts, degree certificates, and language scores with verified OCR extraction and provenance tracking.
              </div>
            </div>
          </Link>

          <Link
            to="/video"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(167, 139, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
              <Eye size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>60-Second Video Intro</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Self-introduction video transcribed with Whisper STT to verify spoken communication clarity and Germany pathway motivation.
              </div>
            </div>
          </Link>

          <Link
            to="/qualification"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Deterministic Qualification Engine</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Rule-by-rule statutory assessment against Anabin, CEFR language requirements, and official German immigration frameworks.
              </div>
            </div>
          </Link>

          <Link
            to="/cv"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
              <FileCheck2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>German Lebenslauf CV Builder</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Compile verified credentials into the German standard DIN 5008 format with AI summaries and one-click PDF export.
              </div>
            </div>
          </Link>

          <Link
            to="/assistant"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>AI Journey Advisor</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                ChatGPT-style context-aware assistant grounded in your dossier for APS, Anabin, blocked account, and visa inquiries.
              </div>
            </div>
          </Link>

          <Link
            to="/opportunities"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6', flexShrink: 0 }}>
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Matched German Opportunities</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Explore live German university degrees, paid Ausbildung vocational contracts, and skilled employment listings.
              </div>
            </div>
          </Link>

          <Link
            to={assessment?.status === 'QUALIFIED' ? '/interview' : '/qualification'}
            className="card"
            style={{
              textDecoration: 'none',
              padding: '1.35rem',
              background: assessment?.status === 'QUALIFIED'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.85))'
                : 'rgba(15, 23, 42, 0.75)',
              border: assessment?.status === 'QUALIFIED'
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: assessment?.status === 'QUALIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: assessment?.status === 'QUALIFIED' ? '#34d399' : '#fbbf24',
                flexShrink: 0,
              }}
            >
              {assessment?.status === 'QUALIFIED' ? <Video size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Live Video Interview Studio</span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    background: assessment?.status === 'QUALIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: assessment?.status === 'QUALIFIED' ? '#34d399' : '#fbbf24',
                    border: assessment?.status === 'QUALIFIED' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  }}
                >
                  {assessment?.status === 'QUALIFIED' ? 'UNLOCKED' : 'QUALIFICATION REQUIRED'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {assessment?.status === 'QUALIFIED'
                  ? 'Rehearse real-time German questions with Dr. Elena Weber, with live speech dictation, scoring, and clearance dossier.'
                  : 'Unlocked strictly when your candidate profile achieves QUALIFIED status under German statutory regulations.'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 6. Matched German Opportunities Preview */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Top Matched German Opportunities
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Programs aligned with your current qualification score and profile dossier
            </div>
          </div>
          <Link
            to="/opportunities"
            style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <span>View All Programs ({opportunityMatches.length})</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {opportunityMatches.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {opportunityMatches.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '1.1rem',
                  borderRadius: '10px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                      {m.opportunity?.title || 'Program Opportunity'}
                    </div>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background: m.matchPercentage >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: m.matchPercentage >= 70 ? '#34d399' : '#fbbf24',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.matchPercentage}% Match
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={13} color="#60a5fa" />
                    <span>{m.opportunity?.organization || 'Educaro Partner'}</span>
                    <span>&bull;</span>
                    <MapPin size={13} color="#f472b6" />
                    <span>{m.opportunity?.location || 'Germany'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {m.opportunity?.type === 'STUDY' ? 'University Degree' : m.opportunity?.type === 'AUSBILDUNG' ? 'Paid Dual Training' : 'Skilled Job'}
                  </span>
                  <Link
                    to="/opportunities"
                    style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            No opportunities computed yet. Upload your transcripts to unlock matching German programs.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
