import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  Compass,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  Search,
  MessageSquare,
  FileText,
  UserCheck,
  Award,
  AlertTriangle,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

export const ConsultantDashboardPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'applicants'>('reviews');
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, applicantsRes] = await Promise.allSettled([
        apiClient.get('/consultant/reviews'),
        apiClient.get('/consultant/applicants'),
      ]);

      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data.success) {
        setReviews(reviewsRes.value.data.reviews || []);
      }
      if (applicantsRes.status === 'fulfilled' && applicantsRes.value.data.success) {
        setApplicants(applicantsRes.value.data.applicants || []);
      }
    } catch (err) {
      console.error('Failed to load consultant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/consultant/reviews/${reviewId}/approve`, {
        notes: reviewNotes || 'Approved by consultant after dossier verification.',
      });
      if (res.data.success) {
        setStatusMsg('Review item approved successfully.');
        setSelectedReview(null);
        setReviewNotes('');
        await fetchData();
      }
    } catch (err) {
      alert('Failed to approve review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection in the notes field.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/consultant/reviews/${reviewId}/reject`, {
        reason: reviewNotes,
      });
      if (res.data.success) {
        setStatusMsg('Review item rejected.');
        setSelectedReview(null);
        setReviewNotes('');
        await fetchData();
      }
    } catch (err) {
      alert('Failed to reject review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestClarification = async (reviewId: string) => {
    if (!reviewNotes.trim()) {
      alert('Please specify what clarification or document is required.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/consultant/reviews/${reviewId}/request-clarification`, {
        clarificationPrompt: reviewNotes,
      });
      if (res.data.success) {
        setStatusMsg('Clarification request dispatched to applicant.');
        setSelectedReview(null);
        setReviewNotes('');
        await fetchData();
      }
    } catch (err) {
      alert('Failed to request clarification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
        <div style={{ maxWidth: '780px' }}>
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
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <ShieldCheck size={13} />
              Educaro Advisor Portal
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
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Clock size={13} />
              SLA Standard: 24h Review Casework
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Educaro Advisor Review & Adjudication Desk
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
            Review flagged applicant credentials, verify Anabin academic equivalence, adjudicate qualification assessments, and issue official pathway authorizations.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.65rem 1.15rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} color="#34d399" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.65rem' }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '0.65rem 1.15rem',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeTab === 'reviews' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)',
            background: activeTab === 'reviews' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'reviews' ? '#60a5fa' : '#94a3b8',
            fontWeight: activeTab === 'reviews' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>Pending Review Queue</span>
          <span
            style={{
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: activeTab === 'reviews' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              color: activeTab === 'reviews' ? '#fff' : '#cbd5e1',
            }}
          >
            {reviews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          style={{
            padding: '0.65rem 1.15rem',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeTab === 'applicants' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)',
            background: activeTab === 'applicants' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'applicants' ? '#60a5fa' : '#94a3b8',
            fontWeight: activeTab === 'applicants' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>Assigned Applicants</span>
          <span
            style={{
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: activeTab === 'applicants' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              color: activeTab === 'applicants' ? '#fff' : '#cbd5e1',
            }}
          >
            {applicants.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Reviews Queue */}
      {activeTab === 'reviews' && (
        <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem' }}>
              <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
              <p style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>Loading review queue...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ maxWidth: '700px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {rev.status || 'PENDING'}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {rev.itemType?.replace('_', ' ') || 'Applicant Dossier Verification'}
                      </h4>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Applicant Case ID: <code style={{ color: '#38bdf8', background: 'rgba(15, 23, 42, 0.8)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{rev.applicantId?.substring(0, 8)}...</code>
                    </div>

                    {rev.notes && (
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.4rem', lineHeight: '1.5' }}>
                        <strong>Trigger Reason:</strong> {rev.notes}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => setSelectedReview(rev)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.55rem 1.15rem' }}
                    >
                      Inspect & Adjudicate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
              <ShieldCheck size={38} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Queue Clear</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No pending items requiring consultant review. All dossiers verified.</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assigned Applicants */}
      {activeTab === 'applicants' && (
        <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {applicants.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {applicants.map((app) => (
                <div
                  key={app.id}
                  className="card"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>
                      {app.user?.firstName} {app.user?.lastName}
                    </div>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {app.currentGoal}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    <div><strong>Email:</strong> {app.user?.email}</div>
                    <div><strong>Location:</strong> {app.location || 'Not Specified'}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Germany Readiness:</span>
                    <strong style={{ color: '#10b981', fontSize: '1.15rem' }}>{app.readinessScore || 0}%</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
              <Users size={38} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>No Active Casework</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No applicants currently assigned to your advisor desk.</div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedReview && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Consultant Adjudication Decision
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Item: {selectedReview.itemType}
                </div>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Official Casework Assessment Notes:
                </label>
                <textarea
                  rows={5}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter official consultant feedback, statutory citation, or document remediation instructions..."
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleReject(selectedReview.id)}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 1.15rem' }}
                >
                  Reject Item (Formmangel)
                </button>
                <button
                  onClick={() => handleRequestClarification(selectedReview.id)}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.6rem 1.15rem' }}
                >
                  Request Clarification (Nachforderung)
                </button>
                <button
                  onClick={() => handleApprove(selectedReview.id)}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.35rem', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)' }}
                >
                  Approve Dossier Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantDashboardPage;
