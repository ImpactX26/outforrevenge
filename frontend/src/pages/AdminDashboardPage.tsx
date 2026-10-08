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
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <BarChart3 size={24} color="#38bdf8" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Nexora System Administration & Telemetry
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Inspect multi-agent bounded execution loops, monitor PostgreSQL shared state, and view compliance audit trails.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Total Registered Users
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
            {analytics?.usersCount || users.length || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Applicants & Consultants
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Average Dossier Readiness
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {analytics?.avgReadinessScore || 72}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            German Qualification Score
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Active Opportunities
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {analytics?.opportunitiesCount || 6}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Uni & Ausbildung Partners
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Agent Executions Logged
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.25rem' }}>
            {analytics?.agentExecutionsCount || agentExecutions.length || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Bounded Loop Traces
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'analytics', label: 'Overview & Metrics', icon: BarChart3 },
          { key: 'agents', label: `Agent Telemetry (${agentExecutions.length})`, icon: Bot },
          { key: 'users', label: `Users (${users.length})`, icon: Users },
          { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: ShieldCheck },
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
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
              Multi-Agent Architecture Summary
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p>
                <strong>Bounded Execution:</strong> The Nexora Master Orchestrator operates with a hard maximum of 8 iterations per run to strictly prevent infinite loops or runaway LLM queries.
              </p>
              <p>
                <strong>PostgreSQL Shared State:</strong> All state transitions (credential extraction, qualification evaluations, routing decisions) are persisted in ACID-compliant tables. Agents do not rely on in-memory chat state.
              </p>
              <p>
                <strong>Deterministic Foundation:</strong> Qualification rules are evaluated through verified German legislation logic (Anerkennungsgesetz). AI generates explanations over deterministic proof.
              </p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
              Educaro Escalation Architecture
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p>
                <strong>Deterministic Routing:</strong> When missing credentials require academic translation, uni-assist filing, or specialized Ausbildung matching, candidates are guided to official Educaro services.
              </p>
              <p>
                <strong>Human-in-the-Loop Escalation:</strong> When discrepancies occur or when dossier completeness reaches 80%+, an Educaro Consultant is assigned to conduct official verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Agent Telemetry */}
      {activeTab === 'agents' && (
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Multi-Agent Execution Logs
          </h3>

          {agentExecutions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.65rem' }}>Agent Type</th>
                    <th style={{ padding: '0.65rem' }}>Status</th>
                    <th style={{ padding: '0.65rem' }}>Started At</th>
                    <th style={{ padding: '0.65rem' }}>Duration</th>
                    <th style={{ padding: '0.65rem' }}>Confidence</th>
                    <th style={{ padding: '0.65rem' }}>Error / Output</th>
                  </tr>
                </thead>
                <tbody>
                  {agentExecutions.map((act) => (
                    <tr key={act.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                        {act.agentType}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          className={`badge ${
                            act.status === 'COMPLETED'
                              ? 'badge-success'
                              : act.status === 'FAILED'
                              ? 'badge-danger'
                              : 'badge-primary'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                        {new Date(act.startedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                        {act.completedAt
                          ? `${(new Date(act.completedAt).getTime() - new Date(act.startedAt).getTime())} ms`
                          : 'In progress'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#10b981' }}>
                        {act.confidence ? `${Math.round(act.confidence * 100)}%` : '100%'}
                      </td>
                      <td style={{ padding: '0.75rem', color: act.error ? '#f87171' : '#94a3b8' }}>
                        {act.error || 'Success'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
              No agent execution traces recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Registered Users ({users.length})
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.65rem' }}>Name</th>
                  <th style={{ padding: '0.65rem' }}>Email</th>
                  <th style={{ padding: '0.65rem' }}>Role</th>
                  <th style={{ padding: '0.65rem' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-primary">{u.role}</span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
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
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Immutable System Audit Logs
          </h3>

          {auditLogs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.65rem' }}>Action</th>
                    <th style={{ padding: '0.65rem' }}>Entity</th>
                    <th style={{ padding: '0.65rem' }}>User / Actor</th>
                    <th style={{ padding: '0.65rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{log.entityType}</td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{log.userId?.substring(0, 8) || 'System'}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
              No audit logs recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
