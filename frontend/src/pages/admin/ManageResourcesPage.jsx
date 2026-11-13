import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Search,
  CheckCircle2,
  EyeOff,
  Trash2,
  ArrowLeft,
  ExternalLink,
  Star,
  Download,
} from 'lucide-react';
import api from '../../services/api';

export default function ManageResourcesPage() {
  const { showToast } = useToast();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Moderate / Delete Modal
  const [activeActionResource, setActiveActionResource] = useState(null);
  const [actionType, setActionType] = useState(''); // 'hide', 'approve', 'delete'
  const [modReason, setModReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/resources?${params.toString()}`);
      if (res.data?.success) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch resources.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [searchQuery, statusFilter]);

  const handleExecuteAction = async () => {
    if (!activeActionResource || !actionType) return;

    try {
      setProcessing(true);
      if (actionType === 'delete') {
        const res = await api.delete(`/admin/resources/${activeActionResource.id}`);
        if (res.data?.success) {
          showToast('Resource permanently deleted.', 'info');
          setResources((prev) => prev.filter((r) => r.id !== activeActionResource.id));
        }
      } else {
        const targetStatus = actionType === 'approve' ? 'approved' : 'hidden';
        const res = await api.put(`/admin/resources/${activeActionResource.id}/moderation`, {
          moderation_status: targetStatus,
          reason: modReason,
        });
        if (res.data?.success) {
          showToast(`Resource status updated to ${targetStatus}.`, 'success');
          setResources((prev) =>
            prev.map((r) =>
              r.id === activeActionResource.id ? { ...r, moderation_status: targetStatus } : r
            )
          );
        }
      }
      setActiveActionResource(null);
      setModReason('');
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
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
            <h1 style={styles.title}>All Academic Materials</h1>
            <p style={styles.subtitle}>
              Review study notes, manage publication visibility, and moderate inappropriate uploads.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="var(--text-secondary)" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, subject, or student uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Moderation Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={styles.emptyCard}>Loading resources...</div>
        ) : resources.length === 0 ? (
          <div style={styles.emptyCard}>No materials matched the search query.</div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Resource Title</th>
                    <th style={styles.th}>Curriculum</th>
                    <th style={styles.th}>Uploader</th>
                    <th style={styles.th}>Downloads</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res.id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link to={`/resources/${res.id}`} style={styles.titleLink}>
                          {res.title}
                        </Link>
                        <span style={styles.metaSub}>
                          {res.resource_type} &bull; {res.file_type?.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <p style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          {res.subject_name}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {res.course_code} Sem {res.semester_number}
                        </p>
                      </td>
                      <td style={styles.td}>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          {res.uploader_name}
                        </p>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {res.uploader_email}
                        </p>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {res.download_count}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              res.moderation_status === 'approved'
                                ? 'var(--success-bg)'
                                : res.moderation_status === 'pending'
                                ? 'var(--warning-bg)'
                                : 'var(--error-bg)',
                            color:
                              res.moderation_status === 'approved'
                                ? 'var(--success)'
                                : res.moderation_status === 'pending'
                                ? 'var(--warning)'
                                : 'var(--error)',
                          }}
                        >
                          {res.moderation_status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionGroup}>
                          {res.moderation_status !== 'approved' && (
                            <button
                              onClick={() => {
                                setActiveActionResource(res);
                                setActionType('approve');
                              }}
                              style={styles.approveBtn}
                              title="Approve resource"
                            >
                              <CheckCircle2 size={14} />
                              <span>Approve</span>
                            </button>
                          )}

                          {res.moderation_status === 'approved' && (
                            <button
                              onClick={() => {
                                setActiveActionResource(res);
                                setActionType('hide');
                              }}
                              style={styles.hideBtn}
                              title="Hide resource"
                            >
                              <EyeOff size={14} />
                              <span>Hide</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveActionResource(res);
                              setActionType('delete');
                            }}
                            style={styles.deleteBtn}
                            title="Delete permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTION MODAL */}
        {activeActionResource && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>
                {actionType === 'delete'
                  ? 'Delete Resource Permanently?'
                  : actionType === 'approve'
                  ? 'Approve Resource for Public Access'
                  : 'Hide Resource from Public View'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1rem' }}>
                Resource: <strong>{activeActionResource.title}</strong>
              </p>

              {actionType !== 'delete' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Reason / Note for Uploader (Optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Provide a constructive reason..."
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
              )}

              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setActiveActionResource(null)}
                  style={styles.cancelBtn}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={processing}
                  style={actionType === 'delete' ? styles.confirmDeleteBtn : styles.confirmBtn}
                >
                  {processing ? 'Processing...' : 'Confirm Action'}
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
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.7rem 1rem 0.7rem 2.4rem',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
  },
  filterSelect: {
    padding: '0.65rem 0.9rem',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    backgroundColor: 'var(--bg-main)',
    borderBottom: '1px solid var(--border-color)',
  },
  th: {
    padding: '0.9rem 1.25rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '1rem 1.25rem',
    verticalAlign: 'middle',
  },
  titleLink: {
    fontWeight: 700,
    fontSize: '0.92rem',
    color: 'var(--primary)',
    display: 'block',
    marginBottom: '2px',
  },
  metaSub: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
  },
  statusBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    textTransform: 'capitalize',
  },
  actionGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  approveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: 'var(--success-bg)',
    color: 'var(--success)',
    border: '1px solid #C8E6C9',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  hideBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: 'var(--warning-bg)',
    color: 'var(--warning)',
    border: '1px solid #FFE0B2',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error)',
    border: '1px solid #FFCDD2',
    padding: '0.35rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
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
    fontSize: '1.15rem',
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
  confirmDeleteBtn: {
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
};
