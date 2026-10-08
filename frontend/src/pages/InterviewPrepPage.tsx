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
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Germany Pathway Interview Simulator
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Practice realistic German visa embassy and employer interview questions with instant multidimensional AI evaluation (structure, cultural etiquette, German vocabulary).
          </p>
        </div>
      </div>

      {/* Setup Session Card */}
      {!session && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Configure Interview Practice Session
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Pathway Type
              </label>
              <select
                value={pathway}
                onChange={(e) => setPathway(e.target.value as GoalType)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              >
                <option value="AUSBILDUNG">Dual Vocational Ausbildung (Salaried Training)</option>
                <option value="STUDY">Higher Education / Master Degree</option>
                <option value="EMPLOYMENT">Skilled Employment (EU Blue Card / Fachkraft)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Target Role / Focus
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Fachinformatiker, Pflegefachmann, Data Scientist"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={handleStartSession}
              disabled={starting}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
            >
              {starting ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              <span>Start Simulation Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Session View */}
      {session && currentQ && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Question Stepper Header */}
          <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '1px solid',
                      borderColor: isCurrent ? '#3b82f6' : isDone ? '#10b981' : 'var(--border-subtle)',
                      background: isCurrent ? 'rgba(37, 99, 235, 0.25)' : isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: isCurrent ? '#60a5fa' : isDone ? '#34d399' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setSession(null)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              End Session
            </button>
          </div>

          {/* Question Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-primary">{currentQ.category}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Question {activeQuestionIndex + 1} of {session.questions.length}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: '1.4' }}>
              {currentQ.question}
            </h2>

            {currentQ.tips && (
              <div
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  fontSize: '0.82rem',
                  color: '#93c5fd',
                }}
              >
                <strong>Interviewer Tip:</strong> {currentQ.tips}
              </div>
            )}

            {/* Answer Input */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Your Answer (English or German):
              </label>
              <textarea
                rows={5}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your response here..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !userAnswer.trim()}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}
              >
                {submitting ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />}
                <span>Submit for AI Evaluation</span>
              </button>
            </div>
          </div>

          {/* AI Feedback Card */}
          {currentEval && (
            <div
              className="card"
              style={{
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={20} color="#10b981" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    AI Evaluation Score
                  </h3>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                  {currentEval.score || 85} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ 100</span>
                </div>
              </div>

              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                {currentEval.feedback || 'Good articulation of your technical background with clear focus on German vocational readiness.'}
              </div>

              {currentEval.improvements && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.82rem',
                    color: '#fbbf24',
                  }}
                >
                  <strong>Suggested Polish:</strong> {currentEval.improvements}
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
