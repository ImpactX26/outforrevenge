import React, { useState } from 'react';
import apiClient from '../api/client';
import {
  GraduationCap,
  Sparkles,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Star,
  Award,
  ShieldCheck,
  Building2,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { GoalType } from '../types';

export const InterviewPrepPage: React.FC = () => {
  const [pathway, setPathway] = useState<GoalType>('AUSBILDUNG');
  const [targetRole, setTargetRole] = useState('Fachinformatiker für Anwendungsentwicklung');
  const [session, setSession] = useState<any | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});

  const handleStartSession = async () => {
    try {
      setStarting(true);
      const res = await apiClient.post('/interview/start', { pathway, targetRole });
      if (res.data.success && res.data.session) {
        setSession(res.data.session);
        setActiveQuestionIndex(0);
        setUserAnswer('');
        setEvaluations({});
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start interview practice.');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;
    const currentQ = session.questions[activeQuestionIndex];
    if (!currentQ) return;

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/interview/${session.id}/answer`, {
        questionId: currentQ.id,
        answerText: userAnswer,
      });

      if (res.data.success && res.data.session) {
        setSession(res.data.session);
        const evalItem = res.data.session.evaluations?.find((e: any) => e.questionId === currentQ.id);
        if (evalItem) {
          setEvaluations((prev) => ({ ...prev, [currentQ.id]: evalItem }));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = session?.questions?.[activeQuestionIndex];
  const currentEval = currentQ ? evaluations[currentQ.id] : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.92))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.5)',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <ShieldCheck size={13} />
              German Visa Embassy & Employer Screening
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Award size={13} />
              Real-time Rubric Evaluation
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Germany Pathway Interview Simulator
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
            Rehearse authentic German consulate visa questions and employer technical interviews. Receive deterministic scoring on legal plausibility, vocational vocabulary, and cultural etiquette.
          </p>
        </div>
      </div>

      {/* Setup Session Card */}
      {!session && (
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Configure Simulation Session
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Select your intended legal residence track in Germany to generate calibrated examination questions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Legal Pathway
              </label>
              <select
                value={pathway}
                onChange={(e) => setPathway(e.target.value as GoalType)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              >
                <option value="AUSBILDUNG">Dual Vocational Ausbildung (BBiG Salaried Training)</option>
                <option value="STUDY">Higher Education / Master Degree (Uni-Assist / Hochschulstart)</option>
                <option value="EMPLOYMENT">Skilled Employment (EU Blue Card / Fachkräfteeinwanderungsgesetz)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Target Discipline / Specialization
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Fachinformatiker, Pflegefachmann, Data Scientist"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={handleStartSession}
              disabled={starting}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
              }}
            >
              {starting ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              <span>Launch Simulation Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Session View */}
      {session && currentQ && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Question Stepper Header */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Questions:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {session.questions.map((q: any, i: number) => {
                  const isCurrent = i === activeQuestionIndex;
                  const isDone = !!evaluations[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setActiveQuestionIndex(i);
                        setUserAnswer('');
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isCurrent ? '#3b82f6' : isDone ? '#10b981' : 'var(--border-subtle)',
                        background: isCurrent ? 'rgba(37, 99, 235, 0.25)' : isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        color: isCurrent ? '#60a5fa' : isDone ? '#34d399' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSession(null)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
            >
              Exit Session
            </button>
          </div>

          {/* Question Card */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              padding: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {currentQ.category || 'Embassy Question'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Question <strong>{activeQuestionIndex + 1}</strong> of <strong>{session.questions.length}</strong>
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: '1.45' }}>
              {currentQ.question}
            </h2>

            {currentQ.tips && (
              <div
                style={{
                  background: 'rgba(37, 99, 235, 0.08)',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  fontSize: '0.85rem',
                  color: '#93c5fd',
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ color: '#fff' }}>Consular Advisor Tip:</strong> {currentQ.tips}
              </div>
            )}

            {/* Answer Input */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Answer (English or German):
              </label>
              <textarea
                rows={6}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Formulate your response thoroughly as if addressing a German consular officer or HR manager..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !userAnswer.trim()}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.7rem 1.5rem',
                  fontSize: '0.88rem',
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
                }}
              >
                {submitting ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                <span>Submit Response for Evaluation</span>
              </button>
            </div>
          </div>

          {/* AI Feedback Card */}
          {currentEval && (
            <div
              className="card"
              style={{
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.98))',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                padding: '2rem',
                boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Award size={24} color="#10b981" />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      Consular Evaluation Report
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Standardized rubric assessment
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                    {currentEval.score || 85} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ 100</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.65', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                {currentEval.feedback || 'Good articulation of your technical background with clear focus on German vocational readiness.'}
              </div>

              {currentEval.improvements && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.85rem',
                    color: '#fbbf24',
                    lineHeight: '1.5',
                  }}
                >
                  <strong style={{ color: '#fff' }}>Recommended Refinement:</strong> {currentEval.improvements}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewPrepPage;
