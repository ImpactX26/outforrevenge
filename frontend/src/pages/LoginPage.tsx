import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Lock, Mail, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithOtp, sendOtp } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
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

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive an OTP');
      return;
    }
    setError(null);
    setSendingOtp(true);
    try {
      const res = await sendOtp(email, 'LOGIN');
      setOtpSent(true);
      if (res?.code) {
        setOtpCode(res.code);
      }
      setSuccessInfo(`Verification code sent to your email (${email}). Please check your inbox.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginWithOtp(email, otpCode);
      if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.user?.role === 'CONSULTANT') {
        navigate('/consultant');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
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
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Access your applicant journey, qualification assessment and CV.
        </p>

        {/* Auth Mode Toggle Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(30, 41, 59, 0.7)',
            padding: '0.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(null); setSuccessInfo(null); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: authMode === 'password' ? '#2563eb' : 'transparent',
              color: authMode === 'password' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(null); setSuccessInfo(null); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: authMode === 'otp' ? '#2563eb' : 'transparent',
              color: authMode === 'otp' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Email OTP
          </button>
        </div>

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

        {successInfo && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successInfo}</span>
          </div>
        )}

        {authMode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="input-dark"
                  placeholder="your.email@example.com"
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
                  Forgot Password?
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
        ) : (
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="email"
                    required
                    className="input-dark"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                  />
                  <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0 0.85rem', whiteSpace: 'nowrap' }}
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  6-Digit Verification Code
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="input-dark"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ paddingLeft: '2.4rem', letterSpacing: '0.2em', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !otpSent || otpCode.length < 6}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Verifying Code...' : 'Sign In with OTP'} <ArrowRight size={16} />
            </button>
          </form>
        )}

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
