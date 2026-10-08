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
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <ShieldCheck size={24} color="#10b981" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Educaro Advisor Review Portal
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Oversee applicant qualification assessments, review flagged documents, and approve pathway recommendations.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'reviews' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
            color: activeTab === 'reviews' ? '#60a5fa' : '#94a3b8',
            fontWeight: activeTab === 'reviews' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Pending Review Queue ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('applicants')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'applicants' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
            color: activeTab === 'applicants' ? '#60a5fa' : '#94a3b8',
            fontWeight: activeTab === 'applicants' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Assigned Applicants ({applicants.length})
        </button>
      </div>

      {/* Tab 1: Reviews Queue */}
      {activeTab === 'reviews' && (
        <div className="card" style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
            </div>
          ) : reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                        {rev.status || 'PENDING'}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {rev.itemType?.replace('_', ' ') || 'Applicant Dossier Check'}
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      Applicant ID: <code style={{ color: '#38bdf8' }}>{rev.applicantId?.substring(0, 8)}...</code>
                    </div>
                    {rev.notes && (
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                        Reason: {rev.notes}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => setSelectedReview(rev)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                    >
                      Inspect & Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              No items requiring consultant review right now.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assigned Applicants */}
      {activeTab === 'applicants' && (
        <div className="card" style={{ padding: '1rem' }}>
          {applicants.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {applicants.map((app) => (
                <div
                  key={app.id}
                  className="card"
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                      {app.user?.firstName} {app.user?.lastName}
                    </div>
                    <span className="badge badge-primary">{app.currentGoal}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Email: {app.user?.email} &bull; Loc: {app.location || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Readiness Score:</span>
                    <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{app.readinessScore || 0}%</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              No applicants currently assigned.
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedReview && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Consultant Dossier Decision
              </h3>
              <button
                onClick={() => setSelectedReview(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                  Consultant Assessment Notes & Feedback:
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter official consultant feedback, document requests, or approval remarks..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleReject(selectedReview.id)}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ color: '#f87171' }}
                >
                  Reject Item
                </button>
                <button
                  onClick={() => handleRequestClarification(selectedReview.id)}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ color: '#fbbf24' }}
                >
                  Request Clarification
                </button>
                <button
                  onClick={() => handleApprove(selectedReview.id)}
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  Approve Dossier
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
