import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  User, Mail, School, BookOpen, Layers, Award, 
  UploadCloud, Download, Bookmark, Star, Lock, Edit3, CheckCircle2 
} from 'lucide-react';

export default function UserProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    college_name: '',
    course_id: '',
    semester_id: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfileAndMetadata();
  }, []);

  const fetchProfileAndMetadata = async () => {
    try {
      setLoading(true);
      const [profRes, courseRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/academic/courses')
      ]);

      const profData = profRes.data.data;
      setProfile(profData);
      setCourses(courseRes.data.data || []);

      setEditForm({
        full_name: profData.full_name || '',
        college_name: profData.college_name || '',
        course_id: profData.course_id || '',
        semester_id: profData.semester_id || ''
      });

      if (profData.course_id) {
        const semRes = await api.get(`/academic/courses/${profData.course_id}/semesters`);
        setSemesters(semRes.data.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (cId) => {
    setEditForm(prev => ({ ...prev, course_id: cId, semester_id: '' }));
    if (!cId) {
      setSemesters([]);
      return;
    }
    try {
      const res = await api.get(`/academic/courses/${cId}/semesters`);
      setSemesters(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editForm.full_name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.put('/users/profile', editForm);
      showToast('Profile updated successfully', 'success');
      setProfile(prev => ({ ...prev, ...res.data.data }));
      if (setAuthUser) {
        setAuthUser(prev => ({ ...prev, ...res.data.data }));
      }
      setIsEditing(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showToast('Password updated securely', 'success');
      setPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Profile Header Card */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        marginBottom: '2rem',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.25rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-md)'
          }}>
            {profile.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {profile.full_name}
              </h1>
              <span style={{
                background: profile.role === 'admin' ? '#FEF3C7' : 'var(--color-accent)',
                color: profile.role === 'admin' ? '#92400E' : 'var(--color-primary)',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {profile.role}
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
              <Mail size={16} /> {profile.email}
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <School size={15} /> {profile.college_name || 'College not set'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BookOpen size={15} /> {profile.course_code ? `${profile.course_code} - Sem ${profile.semester_number}` : 'Academic track pending'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CBD5E1',
              background: isEditing ? '#EDF2F7' : '#fff',
              color: 'var(--color-primary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Edit3 size={16} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button
            onClick={() => setPasswordModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Lock size={16} /> Change Password
          </button>
        </div>
      </div>

      {/* Edit Form Section */}
      {isEditing && (
        <div style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
          border: '1px solid #E2E8F0'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
            Update Academic Information
          </h2>
          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                  College / University *
                </label>
                <input
                  type="text"
                  value={editForm.college_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, college_name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                  Course
                </label>
                <select
                  value={editForm.course_id}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                  Current Semester
                </label>
                <select
                  value={editForm.semester_id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, semester_id: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>Semester {s.semester_number}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', background: '#F1F5F9', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600 }}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aggregate Statistics Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem' }}>
        Academic Activity & Impact
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid #F1F5F9' }}>
          <UploadCloud size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {profile.stats?.totalUploads || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Notes Uploaded</div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid #F1F5F9' }}>
          <Download size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {profile.stats?.totalDownloads || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Materials Downloaded</div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid #F1F5F9' }}>
          <Bookmark size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {profile.stats?.totalBookmarks || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Saved Bookmarks</div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid #F1F5F9' }}>
          <Star size={28} style={{ color: '#F59E0B', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {profile.stats?.averageResourceRating || '0.0'}★
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Avg Resource Rating</div>
        </div>
      </div>

      {/* Password Change Modal */}
      {passwordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
              Change Password
            </h3>
            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPasswordModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', background: '#F1F5F9', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600 }}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
