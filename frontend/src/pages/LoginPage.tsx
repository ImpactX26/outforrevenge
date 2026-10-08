import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.user?.role === 'CONSULTANT') {
        navigate('/consultant');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass123!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
      }}
    >
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.3rem',
            }}
          >
            N
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Nexora
          </span>
        </Link>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          Your intelligent journey to Germany.
        </p>
      </div>

      <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Sign In</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Access your applicant journey, qualification assessment and CV.
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="input-dark"
                placeholder="applicant@nexora.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}>
                Forgot?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="input-dark"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={13} color="#60a5fa" /> Quick Demo Accounts (ImpactX'26):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('applicant@nexora.de')}
              className="badge badge-blue"
              style={{ cursor: 'pointer', border: '1px solid rgba(59, 130, 246, 0.4)' }}
            >
              Demo Applicant
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('consultant@nexora.de')}
              className="badge badge-purple"
              style={{ cursor: 'pointer', border: '1px solid rgba(147, 51, 234, 0.4)' }}
            >
              Demo Consultant
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@nexora.de')}
              className="badge badge-green"
              style={{ cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.4)' }}
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Start your journey
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
