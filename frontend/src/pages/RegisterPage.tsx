import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Lock, Mail, User, Phone, AlertCircle, GraduationCap, Briefcase, Award, KeyRound, CheckCircle2 } from 'lucide-react';
import { GoalType } from '../types';

export const RegisterPage: React.FC = () => {
  const { register, registerWithOtp, sendOtp } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [currentGoal, setCurrentGoal] = useState<GoalType>('AUSBILDUNG');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP Verification state
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSuccessInfo, setOtpSuccessInfo] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive a verification code');
      return;
    }
    setError(null);
    setSendingOtp(true);
    try {
      setOtpCode('');
      await sendOtp(email.trim(), 'REGISTER');
      setOtpSent(true);
      setOtpSuccessInfo(`Verification code has been dispatched to ${email.trim()}. Please check your email inbox and enter the 6-digit code below.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (requireOtp || otpCode.trim().length > 0) {
        if (!otpCode || otpCode.trim().length < 6) {
          setError('Please enter the 6-digit email verification code');
          setLoading(false);
          return;
        }
        await registerWithOtp({
          email,
          code: otpCode.trim(),
          password,
          firstName,
          lastName,
          phone,
          currentGoal,
        });
      } else {
        await register({
          firstName,
          lastName,
          email,
          phone,
          password,
          currentGoal,
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
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
        padding: '2rem 1.5rem',
        background: 'var(--bg-primary)',
      }}
    >
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
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

      <div className="card-glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Create Applicant Account</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Select your Germany goal and start your AI-guided qualification journey.
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

        {otpSuccessInfo && (
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
            <span>{otpSuccessInfo}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Pathway Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Your Target Pathway in Germany
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentGoal('STUDY')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: '8px',
                  background: currentGoal === 'STUDY' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  border: currentGoal === 'STUDY' ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                  color: currentGoal === 'STUDY' ? '#60a5fa' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <GraduationCap size={18} />
                <span>Study</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentGoal('AUSBILDUNG')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: '8px',
                  background: currentGoal === 'AUSBILDUNG' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  border: currentGoal === 'AUSBILDUNG' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  color: currentGoal === 'AUSBILDUNG' ? '#34d399' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Briefcase size={18} />
                <span>Ausbildung</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentGoal('EMPLOYMENT')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: '8px',
                  background: currentGoal === 'EMPLOYMENT' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  border: currentGoal === 'EMPLOYMENT' ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                  color: currentGoal === 'EMPLOYMENT' ? '#818cf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Award size={18} />
                <span>Job</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                First Name
              </label>
              <input
                type="text"
                required
                className="input-dark"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Last Name
              </label>
              <input
                type="text"
                required
                className="input-dark"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Email Address
              </label>
              <button
                type="button"
                onClick={() => {
                  const next = !requireOtp;
                  setRequireOtp(next);
                  if (next && !otpSent && email) {
                    handleSendOtp();
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: requireOtp ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {requireOtp ? '✓ Verifying with OTP' : '+ Verify with Email OTP'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                required
                className="input-dark"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              {requireOtp && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email}
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0 0.75rem', whiteSpace: 'nowrap' }}
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                </button>
              )}
            </div>
          </div>

          {requireOtp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                6-Digit Email Verification Code
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={6}
                  className="input-dark"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{ paddingLeft: '2.4rem', letterSpacing: '0.15em', fontWeight: 700 }}
                />
                <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Mobile Phone (India / International)
            </label>
            <input
              type="text"
              className="input-dark"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Password (min. 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              className="input-dark"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Creating Account...' : 'Start My Journey'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
