import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookOpen, User, Mail, Lock, Building, GraduationCap, Calendar, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    college_name: '',
    course_id: '',
    semester_id: '',
  });

  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Load available courses on mount
  useEffect(() => {
    api
      .get('/academic/courses')
      .then((res) => {
        if (res.data && res.data.courses) {
          setCourses(res.data.courses);
        }
      })
      .catch((err) => console.error('Failed to load courses:', err))
      .finally(() => setLoadingCourses(false));
  }, []);

  // When course changes, load its specific semesters
  useEffect(() => {
    if (formData.course_id) {
      api
        .get(`/academic/courses/${formData.course_id}/semesters`)
        .then((res) => {
          if (res.data && res.data.semesters) {
            setSemesters(res.data.semesters);
            setFormData((prev) => ({ ...prev, semester_id: '' }));
          }
        })
        .catch((err) => console.error('Failed to load semesters:', err));
    } else {
      setSemesters([]);
      setFormData((prev) => ({ ...prev, semester_id: '' }));
    }
  }, [formData.course_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.full_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirm_password ||
      !formData.college_name ||
      !formData.course_id ||
      !formData.semester_id
    ) {
      setError('Please fill in all required registration fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await register(formData);
      showToast(res.message || 'Account created successfully!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <BookOpen size={24} color="#FFFFFF" />
          </div>
          <h2 style={styles.title}>Create Student Account</h2>
          <p style={styles.subtitle}>
            Join ShelfShare to discover and share verified academic notes with peers
          </p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Full Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} color="var(--text-secondary)" style={styles.inputIcon} />
              <input
                type="text"
                name="full_name"
                placeholder="e.g. Rahul Sharma"
                value={formData.full_name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>College / Student Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="var(--text-secondary)" style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                placeholder="student@college.edu"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* College Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>College / University Name</label>
            <div style={styles.inputWrapper}>
              <Building size={18} color="var(--text-secondary)" style={styles.inputIcon} />
              <input
                type="text"
                name="college_name"
                placeholder="e.g. St. Xavier Technical College"
                value={formData.college_name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Course & Semester in Two Columns */}
          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Course / Degree</label>
              <div style={styles.inputWrapper}>
                <GraduationCap size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">{loadingCourses ? 'Loading courses...' : 'Select Course'}</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Current Semester</label>
              <div style={styles.inputWrapper}>
                <Calendar size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <select
                  name="semester_id"
                  value={formData.semester_id}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={!formData.course_id}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      Semester {s.semester_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Password & Confirm Password in Two Columns */}
          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="var(--text-secondary)" style={styles.inputIcon} />
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Repeat password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Creating Account...' : 'Register Student Account'}
            {!submitting && <ArrowRight size={17} />}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.loginLink}>
              Sign in instead
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
    padding: '3rem 1.5rem',
    backgroundColor: 'var(--bg-main)',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
    padding: '2.5rem 2.2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.8rem',
  },
  logoBadge: {
    width: '46px',
    height: '46px',
    backgroundColor: 'var(--primary)',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.8rem',
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
    lineHeight: 1.4,
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
    gap: '1.1rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
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
  select: {
    width: '100%',
    padding: '0.7rem 0.9rem 0.7rem 2.4rem',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '0.8rem',
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
