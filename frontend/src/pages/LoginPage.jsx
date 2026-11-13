import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookOpen, Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      showToast(res.message || 'Login successful!', 'success');

      if (from) {
        navigate(from, { replace: true });
      } else if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setEmail('aarav@shelfshare.edu');
    setPassword('Student@123');
    setError('');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@shelfshare.edu');
    setPassword('Admin@123');
    setError('');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <BookOpen size={24} color="#FFFFFF" />
          </div>
          <h2 style={styles.title}>Sign in to ShelfShare</h2>
          <p style={styles.subtitle}>Enter your academic email to access your study materials</p>
        </div>

        {/* 1-Click Demo Credentials for Viva / Evaluation */}
        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>Quick Demo Sign-In (Click to Autofill):</p>
          <div style={styles.demoBtnRow}>
            <button type="button" onClick={fillDemoStudent} style={styles.demoBtn}>
              <UserCheck size={14} color="var(--primary)" />
              <span>Student (MCA)</span>
            </button>
            <button type="button" onClick={fillDemoAdmin} style={styles.demoBtnAdmin}>
              <ShieldCheck size={14} color="#FFFFFF" />
              <span>Administrator</span>
            </button>
          </div>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
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

          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Password</label>
              <Link to="/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="var(--text-secondary)" style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account yet?{' '}
            <Link to="/register" style={styles.registerLink}>
              Create one now
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
  demoBox: {
    backgroundColor: 'var(--bg-main)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0.8rem',
    marginBottom: '1.25rem',
  },
  demoTitle: {
    fontSize: '0.76rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  demoBtnRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  demoBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.45rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--primary)',
    cursor: 'pointer',
  },
  demoBtnAdmin: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.45rem',
    backgroundColor: 'var(--primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
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
    gap: '1.2rem',
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
  forgotLink: {
    fontSize: '0.8rem',
    color: 'var(--primary)',
    fontWeight: 500,
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
    marginTop: '0.5rem',
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
  registerLink: {
    color: 'var(--primary)',
    fontWeight: 700,
  },
};
