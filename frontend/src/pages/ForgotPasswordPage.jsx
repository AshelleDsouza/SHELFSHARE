import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { BookOpen, Mail, KeyRound, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Request code, 2: Reset password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoCodeNotice, setDemoCodeNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data && res.data.success) {
        showToast('Reset code generated successfully!', 'info');
        if (res.data.demo_reset_code) {
          setDemoCodeNotice(res.data.demo_reset_code);
          setResetCode(res.data.demo_reset_code);
        }
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetCode || !newPassword || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email,
        reset_code: resetCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.data && res.data.success) {
        showToast('Password reset successfully! Please sign in with your new password.', 'success');
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <BookOpen size={24} color="#FFFFFF" />
          </div>
          <h2 style={styles.title}>Password Recovery</h2>
          <p style={styles.subtitle}>
            {step === 1
              ? 'Enter your student email to receive a recovery code'
              : 'Enter the recovery code and your new password'}
          </p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="student@shelfshare.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Generating Code...' : 'Request Reset Code'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={styles.form}>
            {demoCodeNotice && (
              <div style={styles.demoNotice}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>
                  Demo Reset Code Generated: <strong>{demoCodeNotice}</strong> (Autofilled below)
                </span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>6-Digit Reset Code</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="Min 6 characters with numbers"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
              {!loading && <ArrowRight size={17} />}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={styles.backBtn}
            >
              Back to Email Entry
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Remember your credentials?{' '}
            <Link to="/login" style={styles.loginLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1.5rem',
    backgroundColor: 'var(--bg-main)',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
    padding: '2.5rem 2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  logoBadge: {
    width: '46px',
    height: '46px',
    backgroundColor: 'var(--primary)',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 4px 10px rgba(23, 44, 64, 0.2)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--primary)',
    marginBottom: '0.4rem',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  demoNotice: {
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid var(--secondary)',
  },
  errorAlert: {
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error)',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.86rem',
    marginBottom: '1.25rem',
    border: '1px solid #FFCDD2',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem 0.7rem 2.4rem',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.8rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '0.4rem',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '0.3rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.2rem',
  },
  footerText: {
    fontSize: '0.86rem',
    color: 'var(--text-secondary)',
  },
  loginLink: {
    color: 'var(--primary)',
    fontWeight: 700,
  },
};
