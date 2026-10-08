import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Map,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Compass,
  FileText,
  Eye,
  Award,
  Layers,
  FileCheck2,
  Plane,
  Check,
} from 'lucide-react';
import { Journey, JourneyStep, JourneyStepStatus } from '../types';

export const JourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/journey');
      if (res.data.success && res.data.journey) {
        setJourney(res.data.journey);
      }
    } catch (err) {
      console.error('Failed to load journey:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  const handleStepAction = (stepCode: string) => {
    switch (stepCode) {
      case 'INTAKE_COMPLETED':
      case 'INTAKE':
      case 'PROFILE':
        navigate('/profile');
        break;
      case 'DOCUMENTS_UPLOADED':
      case 'DOCUMENTS':
        navigate('/documents');
        break;
      case 'VIDEO_SUBMITTED':
      case 'VIDEO':
        navigate('/video');
        break;
      case 'QUALIFICATION_EVALUATED':
      case 'QUALIFICATION':
        navigate('/qualification');
        break;
      case 'OPPORTUNITY_MATCHED':
      case 'OPPORTUNITIES':
        navigate('/opportunities');
        break;
      case 'EDUCARO_NEXT_STEP':
      case 'NEXT_STEP':
      case 'RECOMMENDATIONS':
        navigate('/next-step');
        break;
      case 'CV_GENERATED':
      case 'CV_BUILDER':
      case 'CV':
        navigate('/cv');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  const getStepIcon = (code: string) => {
    if (code.includes('DOC')) return <FileText size={18} />;
    if (code.includes('VIDEO')) return <Eye size={18} />;
    if (code.includes('QUAL')) return <Award size={18} />;
    if (code.includes('REC') || code.includes('STEP')) return <Layers size={18} />;
    if (code.includes('CV')) return <FileCheck2 size={18} />;
    if (code.includes('VISA') || code.includes('SUBMISSION')) return <Plane size={18} />;
    return <Compass size={18} />;
  };

  const getStatusBadge = (status: JourneyStepStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
            }}
          >
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
            }}
          >
            Active Milestone
          </span>
        );
      case 'REQUIRES_REVIEW':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
            }}
          >
            Review Pending
          </span>
        );
      case 'LOCKED':
      default:
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#64748b',
            }}
          >
            Locked
          </span>
        );
    }
  };

  const progress = journey?.progressPercentage || 28;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
              7-STAGE RELOCATION BLUEPRINT
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              From First Intake to German Arrival
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Personalized Relocation Journey
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '640px', lineHeight: 1.55 }}>
            Each stage locks and unlocks deterministically as your credentials are OCR verified and evaluated against statutory criteria.
          </p>
        </div>

        {/* Progress Gauge */}
        <div style={{ minWidth: '200px', background: 'rgba(15, 23, 42, 0.7)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Overall Progress</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{progress}%</span>
          </div>
          <div className="progress-bar-container" style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#38bdf8' }} />
          </div>
        </div>
      </div>

      {/* 2. Chronological Milestones Timeline */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Sequential Pathway Progression
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            7 Core Stages for German Relocation
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <RefreshCw className="animate-spin" size={28} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Loading journey milestones...</p>
          </div>
        ) : journey?.steps && journey.steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {journey.steps.map((step) => {
              const isCompleted = step.status === 'COMPLETED';
              const isInProgress = step.status === 'IN_PROGRESS';
              const isLocked = step.status === 'LOCKED';

              return (
                <div
                  key={step.id}
                  style={{
                    background: isInProgress
                      ? 'rgba(37, 99, 235, 0.12)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.04)'
                      : 'rgba(30, 41, 59, 0.4)',
                    border: isInProgress
                      ? '1px solid rgba(59, 130, 246, 0.4)'
                      : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.25)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease',
                    opacity: isLocked ? 0.65 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '280px' }}>
                    {/* Step Icon Badge */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isInProgress
                          ? 'rgba(37, 99, 235, 0.2)'
                          : isCompleted
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isInProgress ? '#60a5fa' : isCompleted ? '#34d399' : '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? <Check size={18} /> : getStepIcon(step.code)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
                          STAGE {step.stepOrder}
                        </span>
                        {getStatusBadge(step.status)}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isInProgress ? '#fff' : '#e2e8f0', margin: '0 0 0.35rem 0' }}>
                        {step.title}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div>
                    {!isLocked ? (
                      <button
                        onClick={() => handleStepAction(step.code)}
                        className={isInProgress ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.55rem 1.15rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>{isCompleted ? 'Review Stage' : 'Proceed'}</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.78rem' }}>
                        <Lock size={14} />
                        <span>Prerequisite Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            No journey steps generated. Complete your profile intake to begin.
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyPage;
