import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Briefcase,
  AlertCircle,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  GraduationCap,
  Award,
  Layers,
  ChevronRight,
  Check,
  Video,
  Lock,
  Calendar,
  Clock,
  Send,
  HelpCircle,
  FileCheck2,
  X,
} from 'lucide-react';
import { OpportunityItem, OpportunityMatch, OpportunityType } from '../types';

export const OpportunitiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Core Data State
  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<OpportunityItem[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isQualified, setIsQualified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'STUDY' | 'AUSBILDUNG' | 'EMPLOYMENT' | 'INTERVIEWS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & User Actions
  const [selectedOppForDetails, setSelectedOppForDetails] = useState<OpportunityItem | null>(null);
  const [scheduleModalOpp, setScheduleModalOpp] = useState<{ opp: OpportunityItem; app: any; inv?: any } | null>(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimezone, setPreferredTimezone] = useState('Europe/Berlin');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [schedulingSubmitting, setSchedulingSubmitting] = useState(false);

  const [applyingOppId, setApplyingOppId] = useState<string | null>(null);
  const [missingModal, setMissingModal] = useState<{ oppTitle: string; items: string[] } | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const filter = searchParams.get('filter');
    if (tab === 'interviews') {
      setActiveTab('INTERVIEWS');
    } else if (filter === 'STUDY' || filter === 'AUSBILDUNG' || filter === 'EMPLOYMENT') {
      setActiveTab(filter as any);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, allRes, qualRes, appsRes, interviewsRes] = await Promise.allSettled([
        apiClient.get('/opportunities/matches'),
        apiClient.get('/opportunities'),
        apiClient.get('/qualification/status'),
        apiClient.get('/applications'),
        apiClient.get('/interviews'),
      ]);

      if (matchesRes.status === 'fulfilled' && matchesRes.value.data.success) {
        setMatches(matchesRes.value.data.matches || []);
      }
      if (allRes.status === 'fulfilled' && allRes.value.data.success) {
        setAllOpportunities(allRes.value.data.opportunities || []);
      }
      if (qualRes.status === 'fulfilled' && qualRes.value.data.success) {
        setIsQualified(qualRes.value.data.assessment?.status === 'QUALIFIED');
      }
      if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
        setApplications(appsRes.value.data.applications || []);
      }
      if (interviewsRes.status === 'fulfilled' && interviewsRes.value.data.success) {
        setInterviews(interviewsRes.value.data.interviews || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefreshMatches = async () => {
    try {
      setRefreshing(true);
      await apiClient.post('/ai/orchestrate');
      await fetchData();
    } catch (err) {
      console.error('Match re-calc error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // 1. Prepare Application Action
  const handlePrepareApplication = async (opp: OpportunityItem) => {
    if (!isQualified) {
      alert('Statutory Qualification is required prior to preparing an official German application. Please complete qualification first.');
      navigate('/qualification');
      return;
    }

    try {
      setApplyingOppId(opp.id);
      const res = await apiClient.post('/applications/prepare', { opportunityId: opp.id });
      if (res.data.success) {
        const pkg = res.data.package;
        if (pkg.readinessScore < 75 || (pkg.missingRequirements && pkg.missingRequirements.length > 0)) {
          setMissingModal({
            oppTitle: opp.title,
            items: pkg.missingRequirements || ['Required language certificate or German-standard CV missing'],
          });
        } else {
          await fetchData();
          navigate('/applications');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Complete qualification requirements before applying.');
    } finally {
      setApplyingOppId(null);
    }
  };

  // 2. Schedule / Respond to Interview
  const handleScheduleSubmit = async () => {
    if (!scheduleModalOpp) return;
    const { app, inv } = scheduleModalOpp;

    try {
      setSchedulingSubmitting(true);
      if (inv && inv.id) {
        // Responding to an existing invitation
        await apiClient.post(`/interviews/${inv.roomId || app.interviewRooms?.[0]?.id}/invitations/${inv.id}/respond`, {
          response: 'ACCEPT',
          proposedTime: preferredDate ? new Date(preferredDate).toISOString() : undefined,
        });
      } else {
        // Candidate requesting interview scheduling for submitted application
        if (!preferredDate) {
          alert('Please select your preferred interview date and time.');
          setSchedulingSubmitting(false);
          return;
        }
        await apiClient.post('/interviews/schedule-request', {
          applicationId: app.id,
          preferredDate: new Date(preferredDate).toISOString(),
          timezone: preferredTimezone,
          notes: scheduleNotes,
        });
      }

      await fetchData();
      setScheduleModalOpp(null);
      setPreferredDate('');
      setScheduleNotes('');
      alert('Interview successfully scheduled! You can join the room when the session begins.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule interview. Please try again.');
    } finally {
      setSchedulingSubmitting(false);
    }
  };

  // Adaptive Interview Pathway Checker
  const getInterviewRequirementInfo = (opp: OpportunityItem) => {
    switch (opp.type) {
      case 'EMPLOYMENT':
        return {
          required: true,
          badge: 'Technical & Employer Interview Required',
          description: 'German employers require a technical assessment and cultural fit interview before issuing an offer or visa sponsorship contract.',
        };
      case 'AUSBILDUNG':
        return {
          required: true,
          badge: 'Vocational Dual-Training Interview',
          description: 'Partner vocational schools (Berufsschule) and host companies conduct a German language & motivation interview.',
        };
      case 'STUDY':
      default:
        const hasAptitude = opp.requirements && JSON.stringify(opp.requirements).toLowerCase().includes('interview');
        return {
          required: Boolean(hasAptitude),
          badge: hasAptitude ? 'Faculty Aptitude Assessment' : 'Direct Admission (No Interview Required)',
          description: hasAptitude
            ? 'This degree program includes an admissions entrance interview / Eignungsfeststellung.'
            : 'Tuition-free public university: Direct admission dossier based on German KMK Anabin & APS evaluation. No consular/employer interview required.',
        };
    }
  };

  // Opportunity list with application & interview context
  const opportunitiesWithContext = allOpportunities.map((opp) => {
    const match = matches.find((m) => m.opportunityId === opp.id || m.opportunity?.id === opp.id);
    const app = applications.find((a) => a.opportunityId === opp.id);
    const interview = interviews.find((i) => i.applicationId === app?.id || i.application?.opportunityId === opp.id);
    const room = interview || app?.interviewRooms?.[0];
    const invitation = room?.invitations?.[0] || app?.invitations?.[0];
    const interviewReq = getInterviewRequirementInfo(opp);

    return {
      opp,
      match,
      app,
      room,
      invitation,
      interviewReq,
    };
  });

  // Filter based on tab and search
  const filteredOpportunities = opportunitiesWithContext.filter(({ opp, app, room, invitation }) => {
    if (activeTab === 'INTERVIEWS') {
      if (!app && !room && !invitation) return false;
    } else if (activeTab !== 'ALL' && opp.type !== activeTab) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText =
        opp.title.toLowerCase().includes(q) ||
        opp.organization.toLowerCase().includes(q) ||
        opp.location.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    return true;
  });

  // Check if candidate has an upcoming interview room
  const upcomingInterview = interviews.find(
    (i) => i.status === 'SCHEDULED' || i.status === 'WAITING' || i.status === 'LIVE',
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '1.6rem 1.85rem',
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
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              GERMAN OPPORTUNITY & INTERVIEW PORTAL
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Study • Dual Ausbildung • Skilled Employment
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            German Opportunities & Official Interviews
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '740px', lineHeight: 1.55 }}>
            Interviews are opportunity-specific and scheduled directly through your verified application dossier. Explore programs, submit applications, schedule invitations, and enter live WebRTC interview sessions.
          </p>
        </div>

        <button
          onClick={handleRefreshMatches}
          disabled={refreshing}
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
          <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
          <span>{refreshing ? 'Recalculating...' : 'Refresh Matches'}</span>
        </button>
      </div>

      {/* 2. Upcoming Interview Highlight Banner (If active) */}
      {upcomingInterview ? (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(30, 41, 59, 0.9))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Video size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Upcoming Scheduled Interview: {upcomingInterview.title}</span>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                  {upcomingInterview.status}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#60a5fa" />
                  {upcomingInterview.scheduledAt ? new Date(upcomingInterview.scheduledAt).toLocaleString() : 'Date Pending'}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} color="#fbbf24" />
                  {upcomingInterview.durationMinutes || 45} Min (Europe/Berlin)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/interviews/${upcomingInterview.id}`)}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Video size={16} />
            <span>Join Interview Room &rarr;</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Award size={18} color="#60a5fa" />
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
              <strong>Adaptive Interview Pathways:</strong> In Germany, interviews are tied to specific employers or vocational schools. Complete statutory qualification, prepare your application, and receive official interview invitations.
            </div>
          </div>
          {!isQualified && (
            <Link
              to="/qualification"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', textDecoration: 'none' }}
            >
              Verify Qualification &rarr;
            </Link>
          )}
        </div>
      )}

      {/* 3. Filter Navigation & Search Bar */}
      <div
        className="card"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.1rem 1.35rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Pathway Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Opportunities' },
            { id: 'STUDY', label: 'University Study' },
            { id: 'AUSBILDUNG', label: 'Dual Ausbildung' },
            { id: 'EMPLOYMENT', label: 'Direct Employment' },
            { id: 'INTERVIEWS', label: 'My Opportunity Interviews' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchParams(tab.id === 'INTERVIEWS' ? { tab: 'interviews' } : tab.id === 'ALL' ? {} : { filter: tab.id });
              }}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === tab.id ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                background: activeTab === tab.id ? 'rgba(37, 99, 235, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              {tab.id === 'INTERVIEWS' && <Video size={14} color={activeTab === 'INTERVIEWS' ? '#60a5fa' : '#94a3b8'} />}
              <span>{tab.label}</span>
              {tab.id === 'INTERVIEWS' && interviews.length > 0 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 800,
                  }}
                >
                  {interviews.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role, university, city..."
            style={{
              padding: '0.45rem 0.85rem 0.45rem 2rem',
              borderRadius: '8px',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '0.84rem',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 4. Opportunities Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading German opportunities and interview statuses...</p>
        </div>
      ) : filteredOpportunities.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.35rem' }}>
          {filteredOpportunities.map(({ opp, match, app, room, invitation, interviewReq }) => {
            const hasApplication = Boolean(app);
            const isSubmitted = app?.status === 'SUBMITTED' || app?.status === 'INTERVIEW_INVITED';
            const isInterviewInvited = app?.status === 'INTERVIEW_INVITED' || Boolean(room);
            const isRoomScheduled = room?.status === 'SCHEDULED' || room?.status === 'LIVE' || room?.status === 'WAITING';
            const isRoomCompleted = room?.status === 'COMPLETED';
            const isRoomCancelled = room?.status === 'CANCELLED';

            return (
              <div
                key={opp.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: isInterviewInvited
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div>
                  {/* Top Bar: Title & Pathway / Match Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                        {opp.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={14} color="#60a5fa" />
                          <span>{opp.organization}</span>
                        </div>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={14} color="#f472b6" />
                          <span>{opp.location}</span>
                        </div>
                      </div>
                    </div>

                    {match ? (
                      <span
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: match.matchPercentage >= 75 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                          color: match.matchPercentage >= 75 ? '#34d399' : '#fbbf24',
                          border: match.matchPercentage >= 75 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {match.matchPercentage}% Match
                      </span>
                    ) : null}
                  </div>

                  {/* Pathway & Interview Requirement Badge */}
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: 'rgba(37, 99, 235, 0.15)',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                        color: '#93c5fd',
                        fontWeight: 600,
                      }}
                    >
                      {opp.type === 'STUDY' ? 'University Study' : opp.type === 'AUSBILDUNG' ? 'Dual Ausbildung' : 'Skilled Employment'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: interviewReq.required ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                        border: interviewReq.required ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                        color: interviewReq.required ? '#34d399' : '#94a3b8',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {interviewReq.required ? <Video size={11} /> : <Check size={11} />}
                      <span>{interviewReq.badge}</span>
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 1rem 0' }}>
                    {opp.description}
                  </p>

                  {/* Application & Interview Status Box */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        Dossier & Interview Status:
                      </span>
                      {hasApplication ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa' }}>
                          Application: {app.status}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Not Yet Applied</span>
                      )}
                    </div>

                    {/* Interview timeline state if available */}
                    {room ? (
                      <div style={{ fontSize: '0.78rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={13} color="#60a5fa" />
                          <span>
                            <strong>Interview:</strong>{' '}
                            {room.scheduledAt ? new Date(room.scheduledAt).toLocaleString() : 'Scheduling in progress'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#94a3b8' }}>
                          <Clock size={12} color="#fbbf24" />
                          <span>Status: {room.status} • Timezone: Europe/Berlin</span>
                        </div>
                      </div>
                    ) : invitation ? (
                      <div style={{ fontSize: '0.78rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={13} />
                        <span>Invitation Proposed: {new Date(invitation.proposedTime).toLocaleString()} ({invitation.status})</span>
                      </div>
                    ) : isSubmitted && interviewReq.required ? (
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Application submitted. You may request an interview slot or await partner review.
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {interviewReq.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedOppForDetails(opp)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                  >
                    View Details
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Action 1: Join Interview (When scheduled & authorized) */}
                    {isRoomScheduled ? (
                      <button
                        onClick={() => navigate(`/interviews/${room.id}`)}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.45rem 0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                        }}
                      >
                        <Video size={14} />
                        <span>Join Interview</span>
                      </button>
                    ) : isRoomCompleted ? (
                      <span style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600 }}>
                        Interview Completed
                      </span>
                    ) : isRoomCancelled ? (
                      <span style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 600 }}>
                        Interview Cancelled
                      </span>
                    ) : null}

                    {/* Action 2: Schedule Interview (When submitted or invitation exists) */}
                    {(invitation && invitation.status === 'PENDING') || (isSubmitted && interviewReq.required && !room) ? (
                      <button
                        onClick={() => setScheduleModalOpp({ opp, app, inv: invitation })}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.45rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          borderColor: 'rgba(59, 130, 246, 0.4)',
                          color: '#60a5fa',
                        }}
                      >
                        <Calendar size={13} />
                        <span>Schedule Interview</span>
                      </button>
                    ) : null}

                    {/* Action 3: Prepare Application (When not applied yet) */}
                    {!hasApplication ? (
                      <button
                        onClick={() => handlePrepareApplication(opp)}
                        disabled={applyingOppId === opp.id}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {applyingOppId === opp.id ? <RefreshCw className="animate-spin" size={13} /> : null}
                        <span>Prepare Application</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : app?.status === 'READY_FOR_REVIEW' ? (
                      <button
                        onClick={() => navigate('/applications')}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', background: '#f59e0b', color: '#fff' }}
                      >
                        Confirm Application &rarr;
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Briefcase size={40} color="#64748b" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            {activeTab === 'INTERVIEWS' ? 'No Opportunity Interviews Found' : 'No Matching Opportunities Found'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
            {activeTab === 'INTERVIEWS'
              ? 'Official interviews are scheduled once you submit an application to a dual training or employment position.'
              : 'Try selecting a different pathway filter or clearing your search criteria.'}
          </p>
          <button
            onClick={() => {
              setActiveTab('ALL');
              setSearchQuery('');
              setSearchParams({});
            }}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 5. View Details Modal */}
      {selectedOppForDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: '620px', width: '100%', padding: '2rem', background: '#0f172a', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '14px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.2)', color: '#93c5fd', fontWeight: 700 }}>
                  {selectedOppForDetails.type}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0.5rem 0 0.25rem 0' }}>
                  {selectedOppForDetails.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {selectedOppForDetails.organization} • {selectedOppForDetails.location}
                </div>
              </div>
              <button onClick={() => setSelectedOppForDetails(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.4rem' }}>Overview</h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                  {selectedOppForDetails.description}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.4rem' }}>
                  Adaptive Interview Process
                </h4>
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {getInterviewRequirementInfo(selectedOppForDetails).description}
                </div>
              </div>

              {selectedOppForDetails.requirements && (
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.4rem' }}>Mandatory Requirements</h4>
                  <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.82rem', color: '#94a3b8' }}>
                    {typeof selectedOppForDetails.requirements === 'string'
                      ? selectedOppForDetails.requirements
                      : JSON.stringify(selectedOppForDetails.requirements, null, 2)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setSelectedOppForDetails(null)} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedOppForDetails(null);
                  handlePrepareApplication(selectedOppForDetails);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem' }}
              >
                Prepare Application Dossier &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Schedule Interview Modal */}
      {scheduleModalOpp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', background: '#0f172a', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700 }}>
                  <Calendar size={16} />
                  <span>OFFICIAL INTERVIEW SCHEDULING</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0.35rem 0 0.15rem 0' }}>
                  {scheduleModalOpp.opp.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  {scheduleModalOpp.opp.organization}
                </div>
              </div>
              <button onClick={() => setScheduleModalOpp(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {scheduleModalOpp.inv ? (
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.82rem', color: '#34d399' }}>
                  <strong>Invitation received:</strong> Proposed time is {new Date(scheduleModalOpp.inv.proposedTime).toLocaleString()} ({scheduleModalOpp.inv.timezone || 'Europe/Berlin'}). You can confirm this slot or select a rescheduled time below.
                </div>
              ) : (
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.82rem', color: '#93c5fd' }}>
                  Select your preferred interview date and time. An authorized interview room with live WebRTC and code sandbox will be provisioned.
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: '#020617',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Timezone
                </label>
                <select
                  value={preferredTimezone}
                  onChange={(e) => setPreferredTimezone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: '#020617',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="Europe/Berlin">Europe/Berlin (CET / CEST) - German Standard</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Notes for Interviewer / Consultant (Optional)
                </label>
                <textarea
                  rows={2}
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="e.g. Prefer morning slot, German B1 certified, etc."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: '#020617',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setScheduleModalOpp(null)} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={schedulingSubmitting}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {schedulingSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <Calendar size={14} />}
                <span>Confirm & Schedule Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Requirements Missing Modal */}
      {missingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem', background: '#0f172a', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <AlertCircle size={20} />
              <span>Complete These Requirements First</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              The Application Readiness Agent detected missing statutory credentials for <strong>{missingModal.oppTitle}</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: '#f87171', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {missingModal.items.map((it, idx) => (
                <li key={idx}>{it}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setMissingModal(null)} className="btn" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                Close
              </button>
              <button onClick={() => { setMissingModal(null); navigate('/documents'); }} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                Upload Missing Credentials &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
