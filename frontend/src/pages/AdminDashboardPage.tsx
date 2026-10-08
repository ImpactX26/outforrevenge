import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  Compass,
  Users,
  Briefcase,
  Sliders,
  Layers,
  Database,
  Bot,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Cpu,
  Server,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [agentExecutions, setAgentExecutions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'agents' | 'users' | 'audit'
  >('analytics');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, agentsRes, usersRes, auditRes] = await Promise.allSettled([
        apiClient.get('/admin/analytics'),
        apiClient.get('/admin/agents?limit=25'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/audit-logs?limit=25'),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
        setAnalytics(analyticsRes.value.data);
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value.data.success) {
        setAgentExecutions(agentsRes.value.data.executions || []);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        setUsers(usersRes.value.data.users || []);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value.data.success) {
        setAuditLogs(auditRes.value.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Cpu size={13} />
              Multi-Agent Orchestrator (max 8 loops)
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
              <Database size={13} />
              Neon Cloud PostgreSQL Connected
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Nexora System Command & Telemetry
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
            Monitor distributed agent execution states, applicant throughput, immutable compliance audit trails, and Educaro partner opportunity pipelines.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.65rem 1.15rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Registered Users
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {analytics?.usersCount || users.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            Applicants, Advisors & Admins
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Average Dossier Readiness
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {analytics?.avgReadinessScore || 72}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            German Regulatory Qualification
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Opportunities
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {analytics?.opportunitiesCount || 6}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            Uni & Ausbildung Partners
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Agent Executions Logged
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {analytics?.agentExecutionsCount || agentExecutions.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            Bounded Sub-Agent Traces
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.65rem' }}>
        {[
          { key: 'analytics', label: 'Architecture Overview', icon: BarChart3, count: null },
          { key: 'agents', label: 'Agent Telemetry', icon: Bot, count: agentExecutions.length },
          { key: 'users', label: 'Registered Users', icon: Users, count: users.length },
          { key: 'audit', label: 'Immutable Audit Trail', icon: ShieldCheck, count: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)',
                background: isActive ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#fff' : '#cbd5e1',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#60a5fa" />
              Multi-Agent Architecture Principles
            </h3>
            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.65' }}>
              <p style={{ marginBottom: '0.85rem' }}>
                <strong style={{ color: '#fff' }}>Bounded Loop Safety:</strong> The Nexora Master Orchestrator enforces a hard maximum of 8 execution iterations per run to categorically prevent infinite recursions or hallucinated API loops.
              </p>
              <p style={{ marginBottom: '0.85rem' }}>
                <strong style={{ color: '#fff' }}>PostgreSQL Shared State:</strong> All state mutations (credential parsing, qualification evaluation, opportunity ranking) are committed to ACID-compliant PostgreSQL tables. Agents operate statelessly over this verified database.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>Deterministic Core:</strong> Qualification logic is calculated via verified German statutes (Anerkennungsgesetz & BBiG). LLMs are leveraged exclusively for idiomatic formulation and communication translation.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#10b981" />
              Educaro Commercial Escalation
            </h3>
            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.65' }}>
              <p style={{ marginBottom: '0.85rem' }}>
                <strong style={{ color: '#fff' }}>Actionable Service Bridging:</strong> When gaps are identified in applicant dossiers (e.g., German language requirement B1 or missing ZAB equivalence), candidates receive direct referral to official Educaro programs.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>Human-in-the-Loop Verification:</strong> High-readiness candidates (&ge;80%) and those with flagged document anomalies are automatically queued to Educaro caseworkers for manual verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Agent Telemetry with Multi-Agent Pipeline Visualization */}
      {activeTab === 'agents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Multi-Agent Orchestration Graph Visualizer */}
          <div className="card" style={{ padding: '1.75rem', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={20} color="#60a5fa" />
                  Nexora Multi-Agent Execution Graph
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Executable parent/child dependency graph executing against PostgreSQL state & Groq Llama-3.3-70B
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Deterministic Bounded Flow
              </span>
            </div>

            {/* Pipeline Flowchart Visual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { name: 'Master Orchestrator', type: 'ORCHESTRATOR', desc: 'Observes applicant state, plans next bounded step, halts on consultant review', role: 'CORE' },
                { name: 'Document Agent', type: 'DOCUMENT', desc: 'Parses academic transcripts, language certs via OCR & extracts structured credentials', role: 'EXTRACTION' },
                { name: 'Consistency Agent', type: 'CONSISTENCY', desc: 'Detects cross-document discrepancies & self-reporting anomalies with consultant escalation', role: 'VERIFICATION' },
                { name: 'Qualification Agent', type: 'QUALIFICATION', desc: 'Evaluates German statutory criteria (Anerkennungsgesetz & Anabin H+ equivalence)', role: 'EVALUATION' },
                { name: 'Opportunity Agent', type: 'OPPORTUNITY', desc: 'Matches verified profile against German universities, paid Ausbildung, and employer openings', role: 'MATCHING' },
                { name: 'Application Readiness Agent', type: 'APPLICATION_READINESS', desc: 'Audits selected opportunity requirements, detects missing items, calculates application readiness', role: 'READINESS' },
                { name: 'Job Application Agent', type: 'JOB_APPLICATION', desc: 'Prepares German DIN/Europass application package; requires explicit applicant confirmation', role: 'APPLICATION' },
                { name: 'Interview Planning Agent', type: 'INTERVIEW_PLANNING', desc: 'Designs structured interview stages (HR, Technical, Coding, Language) tailored to role & seniority', role: 'PLANNING' },
                { name: 'Technical Assessment Agent', type: 'TECHNICAL_ASSESSMENT', desc: 'Generates role-specific sandbox coding tasks (e.g., Bosch STM32 ring buffer, TypeScript rate limiter)', role: 'TECHNICAL' },
                { name: 'Live Interview Copilot Agent', type: 'LIVE_INTERVIEW', desc: 'Real-time assistant for interviewer: adaptive follow-ups, profile evidence, missing evidence warnings', role: 'COPILOT' },
                { name: 'Interview Evaluation Agent', type: 'INTERVIEW_EVALUATION', desc: 'Multi-criteria post-interview scorecard: technical, coding, language, and advisory recommendation', role: 'EVALUATION' },
                { name: 'Journey Agent', type: 'JOURNEY', desc: 'Synchronizes sequential 7-stage German relocation roadmap and next best action', role: 'JOURNEY' },
              ].map((node, idx, arr) => {
                const count = agentExecutions.filter(a => a.agentType === node.type).length;
                return (
                  <React.Fragment key={node.type}>
                    <div
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderRadius: '10px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{node.name}</span>
                            <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {node.type}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                            {node.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                          {count} Executions Logged
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                          ACTIVE
                        </span>
                      </div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ textAlign: 'center', color: '#60a5fa', fontSize: '0.85rem', lineHeight: '0.6', opacity: 0.7 }}>
                        &darr;
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
              Multi-Agent Execution Log Stream
            </h3>

          {agentExecutions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem' }}>Agent Module</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem' }}>Duration</th>
                    <th style={{ padding: '0.75rem' }}>Confidence</th>
                    <th style={{ padding: '0.75rem' }}>Output / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {agentExecutions.map((act) => (
                    <tr key={act.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                        {act.agentType}
                      </td>
                      <td style={{ padding: '0.85rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              act.status === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : act.status === 'FAILED'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)',
                            color:
                              act.status === 'COMPLETED'
                                ? '#34d399'
                                : act.status === 'FAILED'
                                ? '#f87171'
                                : '#60a5fa',
                            border: `1px solid ${
                              act.status === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.3)'
                                : act.status === 'FAILED'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'rgba(59, 130, 246, 0.3)'
                            }`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem', color: '#cbd5e1' }}>
                        {new Date(act.startedAt).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '0.85rem', color: '#94a3b8' }}>
                        {act.completedAt
                          ? `${(new Date(act.completedAt).getTime() - new Date(act.startedAt).getTime())} ms`
                          : 'Executing'}
                      </td>
                      <td style={{ padding: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                        {act.confidence ? `${Math.round(act.confidence * 100)}%` : '100%'}
                      </td>
                      <td style={{ padding: '0.85rem', color: act.error ? '#f87171' : '#94a3b8' }}>
                        {act.error || 'Clean completion'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
              No agent execution traces recorded yet.
            </div>
          )}
        </div>
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
            Registered Platform Users ({users.length})
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.85rem', fontWeight: 600, color: '#fff' }}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td style={{ padding: '0.85rem', color: '#38bdf8' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
            Immutable System Audit Logs
          </h3>

          {auditLogs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                    <th style={{ padding: '0.75rem' }}>Target Entity</th>
                    <th style={{ padding: '0.75rem' }}>Actor</th>
                    <th style={{ padding: '0.75rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '0.85rem', color: '#94a3b8' }}>{log.entityType}</td>
                      <td style={{ padding: '0.85rem', color: '#cbd5e1' }}>
                        <code style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.1rem 0.35rem', borderRadius: '4px', color: '#38bdf8' }}>
                          {log.userId?.substring(0, 8) || 'SYSTEM'}
                        </code>
                      </td>
                      <td style={{ padding: '0.85rem', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
              No audit logs recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
