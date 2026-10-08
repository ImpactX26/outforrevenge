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
} from 'lucide-react';
import { Journey, JourneyStep, JourneyStepStatus } from '../types';

export const JourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

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
        navigate('/next-step');
        break;
      case 'CV_GENERATED':
      case 'CV':
        navigate('/cv');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  const getStepIcon = (status: JourneyStepStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={22} color="#10b981" />;
      case 'IN_PROGRESS':
        return <Clock size={22} color="#3b82f6" />;
      case 'PENDING':
        return <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #64748b' }} />;
      case 'LOCKED':
      default:
        return <Lock size={18} color="#475569" />;
    }
  };

  const getStatusBadge = (status: JourneyStepStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-primary">Active Now</span>;
      case 'REQUIRES_REVIEW':
        return <span className="badge badge-warning">Needs Review</span>;
      case 'PENDING':
        return <span className="badge badge-secondary">Pending</span>;
      case 'LOCKED':
      default:
        return <span className="badge badge-secondary" style={{ opacity: 0.6 }}>Locked</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Map size={24} color="#60a5fa" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Your German Relocation Journey
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Visualizing your progression from credential intake to German embassy visa packaging and arrival in Deutschland.
          </p>
        </div>

        <div style={{ minWidth: '180px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Overall Progression
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
            {journey?.progressPercentage || 25}%
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
          <span>Current Milestone: <strong>{journey?.currentState?.replace('_', ' ') || 'INTAKE'}</strong></span>
          <span>{journey?.steps?.filter((s) => s.status === 'COMPLETED').length || 0} of {journey?.steps?.length || 8} Milestones Cleared</span>
        </div>
        <div className="progress-bar-container" style={{ height: '8px' }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${journey?.progressPercentage || 25}%`, background: '#2563eb' }}
          />
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>
          Sequential Milestone Roadmap
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
          </div>
        ) : journey?.steps && journey.steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {journey.steps.map((step, idx) => {
              const isLocked = step.status === 'LOCKED';
              const isCurrent = step.status === 'IN_PROGRESS';
              const isDone = step.status === 'COMPLETED';

              return (
                <div
                  key={step.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: isCurrent
                      ? 'rgba(37, 99, 235, 0.12)'
                      : isDone
                      ? 'rgba(16, 185, 129, 0.05)'
                      : 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid',
                    borderColor: isCurrent
                      ? 'rgba(59, 130, 246, 0.4)'
                      : isDone
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'var(--border-subtle)',
                    opacity: isLocked ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Step Order & Icon */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '40px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isDone
                          ? 'rgba(16, 185, 129, 0.2)'
                          : isCurrent
                          ? 'rgba(37, 99, 235, 0.25)'
                          : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDone ? '#34d399' : isCurrent ? '#60a5fa' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {step.stepOrder || idx + 1}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {step.title}
                      </h3>
                      <div>{getStatusBadge(step.status)}</div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                      {step.description}
                    </p>

                    {/* Step Action Button if unlocked */}
                    {!isLocked && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          onClick={() => handleStepAction(step.code)}
                          className={isCurrent ? 'btn btn-primary' : 'btn btn-secondary'}
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <span>{isDone ? 'Review Milestone' : 'Work on Milestone'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
            No journey steps recorded. Complete profile onboarding to initialize your journey.
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyPage;
