import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCircle, Trash2, ExternalLink, Inbox, Check } from 'lucide-react';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      showToast('Notification marked as read', 'success');
    } catch (err) {
      showToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification deleted', 'info');
    } catch (err) {
      showToast('Failed to delete notification', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{ 
                background: '#DC2626', 
                color: '#fff', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                padding: '0.2rem 0.6rem', 
                borderRadius: '12px' 
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Stay informed on material approvals, reviews, and community updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              color: 'var(--color-primary)',
              cursor: 'pointer'
            }}
          >
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
          Loading your updates...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ 
          background: '#fff', 
          borderRadius: 'var(--radius-lg)', 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <Inbox size={56} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 1.25rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            All Caught Up!
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            You have no notifications right now. When students review your resources or new syllabus notes are uploaded, you'll see them here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
                borderLeft: n.is_read ? '4px solid transparent' : '4px solid var(--color-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'background 0.2s ease'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: n.type === 'review' ? 'var(--color-accent)' : '#EDF2F7',
                    color: 'var(--color-primary)'
                  }}>
                    {n.type || 'System'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                  {n.title}
                </h4>
                <p style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {n.message}
                </p>

                {n.link && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link
                      to={n.link}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        textDecoration: 'underline'
                      }}
                    >
                      View Resource <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#F1F5F9',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title="Delete notification"
                  style={{
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FEE2E2',
                    border: 'none',
                    color: '#DC2626',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
