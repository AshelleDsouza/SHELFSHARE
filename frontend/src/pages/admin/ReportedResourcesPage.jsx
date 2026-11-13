import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

export default function ReportedResourcesPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Modal State
  const [activeReport, setActiveReport] = useState(null);
  const [decision, setDecision] = useState(''); // 'dismissed' or 'action_taken'
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');
      if (res.data?.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch moderation reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolveReport = async () => {
    if (!activeReport || !decision) return;

    try {
      setProcessing(true);
      const hideResource = decision === 'action_taken';
      const res = await api.put(`/admin/reports/${activeReport.id}`, {
        status: decision,
        admin_notes: adminNotes,
        hide_resource: hideResource,
      });

      if (res.data?.success) {
        showToast(`Report marked as ${decision}.`, 'success');
        setReports((prev) =>
          prev.map((r) =>
            r.id === activeReport.id ? { ...r, status: decision, admin_notes: adminNotes } : r
          )
        );
        setActiveReport(null);
        setAdminNotes('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to resolve report.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/admin" style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Admin Console</span>
          </Link>
        </div>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Reported Academic Content</h1>
            <p style={styles.subtitle}>
              Review user feedback on incorrect notes, copyright issues, or inappropriate materials.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.emptyCard}>Loading moderation reports...</div>
        ) : reports.length === 0 ? (
          <div style={styles.emptyCard}>
            <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>All Clear!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              No outstanding moderation reports submitted by students.
            </p>
          </div>
        ) : (
          <div style={styles.reportsGrid}>
            {reports.map((rep) => (
              <div
                key={rep.id}
                style={{
                  ...styles.reportCard,
                  borderColor: rep.status === 'pending' ? 'var(--warning)' : 'var(--border-color)',
                }}
              >
                <div style={styles.cardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Flag
                      size={18}
                      color={rep.status === 'pending' ? 'var(--error)' : 'var(--text-secondary)'}
                    />
                    <span style={styles.reasonBadge}>{rep.reason}</span>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        rep.status === 'pending'
                          ? 'var(--warning-bg)'
                          : rep.status === 'action_taken'
                          ? 'var(--error-bg)'
                          : 'var(--bg-main)',
                      color:
                        rep.status === 'pending'
                          ? 'var(--warning)'
                          : rep.status === 'action_taken'
                          ? 'var(--error)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {rep.status}
                  </span>
                </div>

                <div style={styles.resourceBox}>
                  <span style={styles.resLabel}>Reported Resource:</span>
                  <Link to={`/resources/${rep.resource_id}`} style={styles.resTitle}>
                    {rep.resource_title}
                    <ExternalLink size={13} style={{ marginLeft: '4px', display: 'inline' }} />
                  </Link>
                  <p style={styles.uploaderText}>
                    Uploaded by: <strong>{rep.uploader_name}</strong> ({rep.uploader_email})
                  </p>
                </div>

                {rep.description && (
                  <div style={styles.descriptionBox}>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{rep.description}"
                    </p>
                  </div>
                )}

                <div style={styles.reporterMeta}>
                  <span>
                    Reported by: <strong>{rep.reporter_name}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>{new Date(rep.created_at).toLocaleString()}</span>
                </div>

                {rep.admin_notes && (
                  <div style={styles.adminNotesBox}>
                    <strong>Admin Note:</strong> {rep.admin_notes}
                  </div>
                )}

                {rep.status === 'pending' && (
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => {
                        setActiveReport(rep);
                        setDecision('dismissed');
                      }}
                      style={styles.dismissBtn}
                    >
                      <XCircle size={15} />
                      <span>Dismiss Report</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveReport(rep);
                        setDecision('action_taken');
                      }}
                      style={styles.takeActionBtn}
                    >
                      <AlertTriangle size={15} />
                      <span>Take Action (Hide Resource)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RESOLUTION DIALOG */}
        {activeReport && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>
                {decision === 'action_taken'
                  ? 'Take Action & Hide Resource'
                  : 'Dismiss Moderation Report'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.25rem' }}>
                Resource: <strong>{activeReport.resource_title}</strong> (Reason: {activeReport.reason})
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Administrative Note (Logged for audit history)
                </label>
                <textarea
                  rows="3"
                  placeholder="Record your moderation decision justification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem' }}
                />
              </div>

              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  style={styles.cancelBtn}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveReport}
                  disabled={processing}
                  style={decision === 'action_taken' ? styles.confirmActionBtn : styles.confirmBtn}
                >
                  {processing ? 'Saving...' : `Confirm (${decision})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: 'var(--bg-main)',
    padding: '2.5rem 1.5rem 5rem',
    minHeight: 'calc(100vh - 140px)',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '0.88rem',
  },
  header: {
    marginBottom: '1.75rem',
  },
  title: {
    fontSize: '1.9rem',
    fontWeight: 800,
    color: 'var(--primary)',
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '1.5rem',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border-color)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonBadge: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--primary)',
    backgroundColor: 'var(--secondary-light)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  statusBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    textTransform: 'capitalize',
  },
  resourceBox: {
    backgroundColor: 'var(--bg-main)',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
  },
  resLabel: {
    fontSize: '0.74rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
    display: 'block',
    marginBottom: '2px',
  },
  resTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--primary)',
  },
  uploaderText: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  descriptionBox: {
    backgroundColor: '#FFF9C4',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    borderLeft: '3px solid #FBC02D',
  },
  reporterMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  adminNotesBox: {
    backgroundColor: 'var(--bg-main)',
    padding: '0.6rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    borderLeft: '3px solid var(--primary)',
  },
  cardActions: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-color)',
  },
  dismissBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    padding: '0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  takeActionBtn: {
    flex: 1.3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    backgroundColor: 'var(--error-bg)',
    border: '1px solid #FFCDD2',
    padding: '0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--error)',
    cursor: 'pointer',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '4rem',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 44, 64, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '460px',
    width: '100%',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--primary)',
  },
  modalActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  cancelBtn: {
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    padding: '0.6rem 1.1rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
  confirmActionBtn: {
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
};
