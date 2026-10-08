import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  FileCheck2,
  Video,
  ChevronRight,
  RefreshCw,
  Send,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/applications');
      if (res.data.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleConfirmSubmission = async (appId: string) => {
    try {
      setConfirmingId(appId);
      setActionError(null);
      const res = await apiClient.post(`/applications/${appId}/confirm`);
      if (res.data.success) {
        await fetchApplications();
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(res.data.application);
        }
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to confirm application.');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>
            Submitted
          </span>
        );
      case 'INTERVIEW_INVITED':
        return (
          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
            Interview Invited
          </span>
        );
      case 'READY_FOR_REVIEW':
        return (
          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}>
            Ready For Your Confirmation
          </span>
        );
      case 'DRAFT':
        return (
          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#94a3b8' }}>
            Draft (Requirements Missing)
          </span>
        );
      default:
        return (
          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#94a3b8' }}>
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" size={32} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)', color: '#60a5fa', fontWeight: 700 }}>
              ???? GERMAN APPLICATION PIPELINE
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0' }}>
            My German Job & Program Applications
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
            Every application package is evaluated by the Application Readiness Agent before explicit candidate confirmation.
          </p>
        </div>

        <button
          onClick={() => navigate('/opportunities')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', padding: '0.65rem 1.25rem' }}
        >
          <Briefcase size={16} />
          <span>Browse German Opportunities</span>
        </button>
      </div>

      {actionError && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Briefcase size={48} color="#64748b" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No Active Applications</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Select a verified opportunity from the Opportunities catalog and run the Application Readiness check to prepare your application package.
          </p>
          <button
            onClick={() => navigate('/opportunities')}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            Explore Opportunities &rarr;
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {applications.map((app) => {
            const report = app.readinessReport || {};
            const missing = report.missingRequirements || [];
            const readiness = Math.round(app.readinessScore || 0);
            const isInterviewInvited = app.status === 'INTERVIEW_INVITED' || app.interviewRooms?.length > 0;
            const latestRoom = app.interviewRooms?.[0];

            return (
              <div
                key={app.id}
                className="card"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem 0' }}>
                        {app.opportunity?.title || 'Target Position'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                        <Building2 size={14} color="#60a5fa" />
                        <span>{app.opportunity?.organization}</span>
                        <span>&bull;</span>
                        <MapPin size={14} color="#f472b6" />
                        <span>{app.opportunity?.location || 'Germany'}</span>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  {/* Readiness and Match scores */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0' }}>
                    <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Application Readiness</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: readiness >= 75 ? '#34d399' : '#fbbf24', marginTop: '0.2rem' }}>
                        {readiness}%
                      </div>
                    </div>
                    <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Opportunity Match</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.2rem' }}>
                        {app.matchScore ? Math.round(app.matchScore) : 88}%
                      </div>
                    </div>
                  </div>

                  {/* Document & Dossier Indicators */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: app.cvId ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: app.cvId ? '#34d399' : '#f87171' }}>
                      <FileCheck2 size={13} />
                      <span>{app.cvId ? 'German CV Attached' : 'Missing CV'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: app.coverLetterId ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: app.coverLetterId ? '#34d399' : '#94a3b8' }}>
                      <FileText size={13} />
                      <span>{app.coverLetterId ? 'Cover Letter Attached' : 'No Cover Letter'}</span>
                    </div>
                  </div>

                  {/* Missing requirements warnings if any */}
                  {missing.length > 0 && (
                    <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.76rem', color: '#fbbf24', marginTop: '0.5rem' }}>
                      <strong>Pending items:</strong> {missing.join(', ')}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  {app.status === 'READY_FOR_REVIEW' && (
                    <button
                      onClick={() => handleConfirmSubmission(app.id)}
                      disabled={confirmingId === app.id}
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      {confirmingId === app.id ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />}
                      <span>Confirm & Submit Application</span>
                    </button>
                  )}

                  {isInterviewInvited && (
                    <button
                      onClick={() => navigate(`/interviews/${latestRoom?.id || app.interviewRooms?.[0]?.id}`)}
                      className="btn"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
                    >
                      <Video size={15} />
                      <span>Join Interview Room &rarr;</span>
                    </button>
                  )}

                  {app.status === 'SUBMITTED' && !isInterviewInvited && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#60a5fa' }}>
                      <Clock size={15} />
                      <span>Awaiting employer interview invitation</span>
                    </div>
                  )}

                  {app.status === 'DRAFT' && (
                    <button
                      onClick={() => navigate('/documents')}
                      className="btn"
                      style={{ flex: 1, fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}
                    >
                      Upload Missing Credentials
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
