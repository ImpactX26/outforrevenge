import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { OpportunityItem, OpportunityMatch, OpportunityType } from '../types';

export const OpportunitiesPage: React.FC = () => {
  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | OpportunityType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<OpportunityMatch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, allRes] = await Promise.allSettled([
        apiClient.get('/opportunities/matches'),
        apiClient.get('/opportunities'),
      ]);

      if (matchesRes.status === 'fulfilled' && matchesRes.value.data.success) {
        setMatches(matchesRes.value.data.matches || []);
      }
      if (allRes.status === 'fulfilled' && allRes.value.data.success) {
        setAllOpportunities(allRes.value.data.opportunities || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
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

  const filteredMatches = matches.filter((m) => {
    const opp = m.opportunity;
    if (!opp) return false;
    const matchesType = activeFilter === 'ALL' || opp.type === activeFilter;
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            Matched German Opportunities
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Curated universities, dual Ausbildung training partners, and employer positions in Germany scored deterministically against your verified dossier credentials.
          </p>
        </div>
        <button
          onClick={handleRefreshMatches}
          disabled={refreshing}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.6rem 1.2rem' }}
        >
          {refreshing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
          <span>Re-Compute Matches</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Pathway Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'STUDY', 'AUSBILDUNG', 'EMPLOYMENT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilter === t ? '#3b82f6' : 'var(--border-subtle)',
                background: activeFilter === t ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: activeFilter === t ? '#60a5fa' : '#94a3b8',
                fontWeight: activeFilter === t ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {t === 'ALL' ? 'All Pathways' : t === 'STUDY' ? 'University Study' : t === 'AUSBILDUNG' ? 'Ausbildung' : 'Direct Jobs'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search company, degree, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.2rem',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
        </div>
      ) : filteredMatches.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredMatches.map((m) => {
            const opp = m.opportunity;
            const isHigh = m.matchPercentage >= 70;
            const isMed = m.matchPercentage >= 50 && m.matchPercentage < 70;
            return (
              <div
                key={m.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderColor: isHigh ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      {opp?.type}
                    </span>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        background: isHigh
                          ? 'rgba(16, 185, 129, 0.2)'
                          : isMed
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                        color: isHigh ? '#34d399' : isMed ? '#fbbf24' : '#f87171',
                      }}
                    >
                      {m.matchPercentage}% Match
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem' }}>
                    {opp?.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building2 size={13} />
                      <span>{opp?.organization}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} />
                      <span>{opp?.location}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 0.85rem' }}>
                    {opp?.description}
                  </p>

                  {/* Matched Requirements List */}
                  {m.matchedRequirements && m.matchedRequirements.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginBottom: '0.2rem' }}>
                        Matched Criteria:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {m.matchedRequirements.map((mr, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6ee7b7',
                            }}
                          >
                            &bull; {mr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Requirements List */}
                  {m.missingRequirements && m.missingRequirements.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.2rem' }}>
                        Missing Criteria:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {m.missingRequirements.map((mr, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fde68a',
                            }}
                          >
                            &times; {mr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {opp?.isDemoData ? 'Verified Partner Program' : 'Live Opportunity'}
                  </div>
                  <button
                    onClick={() => setSelectedMatch(m)}
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
          No matching opportunities found for current filters. Update your profile or click "Re-Compute Matches".
        </div>
      )}

      {/* Opportunity Details Modal */}
      {selectedMatch && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {selectedMatch.opportunity?.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                  {selectedMatch.opportunity?.organization} &bull; {selectedMatch.opportunity?.location}
                </div>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Program Overview & Requirements
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {selectedMatch.opportunity?.description}
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                  AI Match Synthesis & Next Steps
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {selectedMatch.reason || 'This program closely matches your academic degree and target German language readiness.'}
                </p>
                {selectedMatch.nextAction && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                    Recommended Action: {selectedMatch.nextAction}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedMatch(null)} className="btn btn-secondary">
                Close
              </button>
              <button
                onClick={() => {
                  alert('Application request forwarded to Educaro Advisor team for dossier submission.');
                  setSelectedMatch(null);
                }}
                className="btn btn-primary"
              >
                Apply via Educaro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
