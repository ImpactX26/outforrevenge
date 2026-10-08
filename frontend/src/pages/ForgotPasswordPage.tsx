import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { ArrowRight, Lock, Mail, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive a recovery code');
      return;
    }
    setError(null);
    setSendingOtp(true);
    try {
      const res = await apiClient.post('/auth/otp/send', {
        email,
        purpose: 'FORGOT_PASSWORD',
      });
      setOtpSent(true);
      const devHint = res.data.code ? ` (Dev Code: ${res.data.code})` : '';
      setSuccessInfo(`Recovery code sent to ${email}${devHint}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send recovery code. Please check your email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await apiClient.post('/auth/otp/reset-password', {
        email,
        code: otpCode,
        newPassword,
      });
      setSuccessInfo('Password reset successfully! Redirecting to login in 2 seconds...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired recovery code.');
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
          Account recovery & password reset.
        </p>
      </div>

      <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Reset Password</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Enter your registered email address to receive a 6-digit recovery code.
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

        <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
              </button>
            </div>
          </div>

          {otpSent && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  6-Digit Recovery Code
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    className="input-dark"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                  />
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    className="input-dark"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                  />
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              >
                {loading ? 'Updating Password...' : 'Set New Password'} <ArrowRight size={16} />
              </button>
            </>
          )}
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
