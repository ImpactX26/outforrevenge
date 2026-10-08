import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import {
  Compass,
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
  ShieldAlert,
} from 'lucide-react';
import {
  ApplicantProfile,
  NextStepRecommendation,
  OpportunityMatch,
  QualificationAssessment,
  AgentExecution,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [nextStep, setNextStep] = useState<NextStepRecommendation | null>(null);
  const [assessment, setAssessment] = useState<QualificationAssessment | null>(null);
  const [opportunityMatches, setOpportunityMatches] = useState<OpportunityMatch[]>([]);
  const [agentActivity, setAgentActivity] = useState<AgentExecution[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestratorMsg, setOrchestratorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, nextStepRes, qualRes, oppRes, actRes] = await Promise.allSettled([
        apiClient.get('/applicant/profile'),
        apiClient.get('/recommendations/next-step'),
        apiClient.get('/qualification/latest'),
        apiClient.get('/opportunities/matches'),
        apiClient.get('/ai/activity?limit=5'),
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
      if (actRes.status === 'fulfilled' && actRes.value.data.success) {
        setAgentActivity(actRes.value.data.executions || []);
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

  const handleRunOrchestrator = async () => {
    try {
      setIsOrchestrating(true);
      setOrchestratorMsg(null);
      const res = await apiClient.post('/ai/orchestrate');
      if (res.data.success) {
        setOrchestratorMsg(`Orchestrator finished ${res.data.iterationsExecuted || 1} agent loops successfully!`);
        await fetchDashboardData();
      }
    } catch (err: any) {
      setOrchestratorMsg(err.response?.data?.message || 'Agent orchestration completed with notice.');
    } finally {
      setIsOrchestrating(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'QUALIFIED':
        return <span className="badge badge-success">Direct Qualified</span>;
      case 'PARTIALLY_QUALIFIED':
        return <span className="badge badge-warning">Partially Qualified</span>;
      case 'MORE_INFORMATION_REQUIRED':
        return <span className="badge badge-info">Info Required</span>;
      default:
        return <span className="badge badge-secondary">Pending Evaluation</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading your Nexora workspace...</p>
        </div>
      </div>
    );
  }

  const completeness = profile?.profileCompleteness || 25;
  const readiness = profile?.readinessScore || assessment?.score || 30;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome & Master Agent Control */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Willkommen, {user?.firstName}!
            </h1>
            <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
              Target: {profile?.currentGoal?.toLowerCase() || 'Study'} in Germany
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
            Nexora Multi-Agent Orchestrator is actively analyzing your pathway, credentials, and Educaro routing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRunOrchestrator}
            disabled={isOrchestrating}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            {isOrchestrating ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                <span>Running Agent Loop...</span>
              </>
            ) : (
              <>
                <Sparkles size={17} />
                <span>Trigger Agent Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {orchestratorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{orchestratorMsg}</span>
        </div>
      )}

      {/* Primary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Readiness Score Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Germany Readiness Score
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {readiness} <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>/ 100</span>
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
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
          <div className="progress-bar-container" style={{ height: '7px', marginBottom: '0.75rem' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${readiness}%`,
                background: readiness > 75 ? '#10b981' : readiness > 45 ? '#f59e0b' : '#3b82f6',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Evaluation:</span>
            {getStatusBadge(assessment?.status)}
          </div>
        </div>

        {/* Profile Completeness Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dossier Completeness
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {completeness}%
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
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
          <div className="progress-bar-container" style={{ height: '7px', marginBottom: '0.75rem' }}>
            <div className="progress-bar-fill" style={{ width: `${completeness}%`, background: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Next: Upload missing documents</span>
            <Link to="/profile" style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              Edit Dossier &rarr;
            </Link>
          </div>
        </div>

        {/* Pathway Target Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current German Goal
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
                {profile?.currentGoal === 'STUDY'
                  ? 'Higher Education / Master'
                  : profile?.currentGoal === 'AUSBILDUNG'
                  ? 'Dual Vocational Ausbildung'
                  : 'Skilled Employment (Fachkraft)'}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
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
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Regulated by German Recognition Act (Anerkennungsgesetz).
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/qualification" style={{ fontSize: '0.75rem', color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
              View German Requirements &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Split: Next Recommended Step & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Next Recommended Step Card (Crucial for Educaro Workflow) */}
        <div
          className="card"
          style={{
            borderColor: 'rgba(59, 130, 246, 0.4)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#60a5fa" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Next Recommended Step
              </h2>
            </div>
            <span className="badge badge-primary">
              {nextStep?.type === 'EDUCARO_SERVICE'
                ? 'Educaro Service'
                : nextStep?.type === 'CONSULTANT_REFERRAL'
                ? 'Expert Consultation'
                : 'Action Required'}
            </span>
          </div>

          {nextStep ? (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                {nextStep.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1rem' }}>
                {nextStep.reason}
              </p>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Deterministic Rule Evidence:
                </div>
                <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                  {nextStep.supportingEvidence?.ruleDescription ||
                    nextStep.supportingEvidence?.remediationAction ||
                    'Matches current dossier completion threshold.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => navigate('/next-step')}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <span>Proceed with Step</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/qualification')}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1rem' }}
                >
                  View Criteria
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Upload your transcripts or run qualification check to generate targeted next steps.
              </p>
              <button onClick={() => navigate('/documents')} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Upload Documents
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Quick Actions & Tools
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <Link
              to="/documents"
              className="card"
              style={{
                textDecoration: 'none',
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <FileText size={20} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Upload Transcripts</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Extract GPA & Degree</div>
              </div>
            </Link>

            <Link
              to="/video"
              className="card"
              style={{
                textDecoration: 'none',
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Eye size={20} color="#a78bfa" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Video Pitch</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>60s Speech-to-Text</div>
              </div>
            </Link>

            <Link
              to="/cv"
              className="card"
              style={{
                textDecoration: 'none',
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <FileText size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>German Lebenslauf</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>DIN 5008 PDF Generator</div>
              </div>
            </Link>

            <Link
              to="/assistant"
              className="card"
              style={{
                textDecoration: 'none',
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Bot size={20} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Journey Advisor</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Context-aware AI Chat</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Matched Opportunities & Agent Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Matched German Opportunities Preview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Matched German Opportunities
            </h2>
            <Link to="/opportunities" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
              View All ({opportunityMatches.length}) &rarr;
            </Link>
          </div>

          {opportunityMatches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {opportunityMatches.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                      {m.opportunity?.title || 'Program Opportunity'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <Building2 size={13} />
                      <span>{m.opportunity?.organization || 'Educaro Partner'}</span>
                      <span>&bull;</span>
                      <MapPin size={13} />
                      <span>{m.opportunity?.location || 'Germany'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: m.matchPercentage >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: m.matchPercentage >= 70 ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {m.matchPercentage}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              No matches computed yet. Run the qualification evaluation to see matched universities and employers.
            </div>
          )}
        </div>

        {/* Recent Agent Activity Timeline */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Recent Agent Activity
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PostgreSQL Shared State</span>
          </div>

          {agentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {agentActivity.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                  }}
                >
                  <Bot size={16} color="#60a5fa" />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{act.agentType}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      {new Date(act.startedAt).toLocaleTimeString()} &bull; {act.status}
                    </div>
                  </div>
                  {act.confidence && (
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {Math.round(act.confidence * 100)}% conf
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              No agent logs recorded yet. Trigger the agent loop to start automated tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
