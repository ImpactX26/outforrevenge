import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  GraduationCap,
  Award,
  Layers,
  ChevronRight,
  Check,
  Video,
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
    <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#f472b6',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              GERMAN OPPORTUNITY NETWORK
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Universities • Vocational Dual Training • Skilled Employment
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Matched German Opportunities
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, maxWidth: '720px', lineHeight: 1.55 }}>
            Curated universities, dual Ausbildung training institutions, and employers in Germany scored deterministically against your verified qualification dossier.
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
          <span>{refreshing ? 'Recalculating Matches...' : 'Re-Calculate Matches'}</span>
        </button>
      </div>

      {/* 2. Filter & Search Control Bar */}
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
          {(['ALL', 'STUDY', 'AUSBILDUNG', 'EMPLOYMENT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeFilter === t ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                background: activeFilter === t ? 'rgba(37, 99, 235, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: activeFilter === t ? '#60a5fa' : '#94a3b8',
                fontWeight: activeFilter === t ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'ALL'
                ? 'All Pathways'
                : t === 'STUDY'
                ? 'University Study'
                : t === 'AUSBILDUNG'
                ? 'Dual Ausbildung'
                : 'Direct Employment'}
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
            placeholder="Search by city, university, role..."
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

      {/* 3. Opportunities Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Matching opportunities against your dossier criteria...</p>
        </div>
      ) : filteredMatches.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredMatches.map((m) => {
            const opp = m.opportunity;
            const isHighMatch = m.matchPercentage >= 75;

            return (
              <div
                key={m.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: isHighMatch ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                      {opp.title}
                    </h3>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: isHighMatch ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                        color: isHighMatch ? '#34d399' : '#fbbf24',
                        border: isHighMatch ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.matchPercentage}% Match
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={14} color="#60a5fa" />
                      <span>{opp.organization}</span>
                    </div>
                    <span>&bull;</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} color="#f472b6" />
                      <span>{opp.location}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 1rem 0' }}>
                    {opp.description}
                  </p>

                  {/* Requirements Checklist */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Pathway Match Rationale:
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                      {m.reason || 'Credentials align with entry criteria and language thresholds.'}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(37, 99, 235, 0.15)',
                      color: '#93c5fd',
                      fontWeight: 600,
                    }}
                  >
                    {opp.type === 'STUDY' ? 'Public University' : opp.type === 'AUSBILDUNG' ? 'Paid Dual Training' : 'Skilled Job'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Link
                      to="/interview"
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                    >
                      <Video size={13} />
                      <span>Video Interview</span>
                    </Link>
                    <button
                      onClick={() => alert(`Connecting with Educaro advisor for application to: ${opp.title} (${opp.organization})`)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Apply</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Briefcase size={38} color="#64748b" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            No Matching Opportunities Found
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            Try clearing filters or search query, or re-run the qualification evaluation.
          </p>
          <button onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
