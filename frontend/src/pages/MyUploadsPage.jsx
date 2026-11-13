import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Upload,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Star,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';

const RESOURCE_TYPES = [
  'Lecture Notes',
  'Handwritten Notes',
  'Previous Year Question Papers',
  'Assignments',
  'Presentations',
  'Programming Examples',
  'Reference Materials',
  'Other',
];

export default function MyUploadsPage() {
  const { showToast } = useToast();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    resource_type: '',
    unit_name: '',
    tags: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirmation Modal State
  const [deletingResource, setDeletingResource] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMyUploads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resources/my-uploads');
      if (res.data?.success) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch uploads.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyUploads();
  }, []);

  const openEditModal = (res) => {
    setEditingResource(res);
    setEditForm({
      title: res.title,
      description: res.description,
      resource_type: res.resource_type,
      unit_name: res.unit_name || '',
      tags: res.tags || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingResource) return;

    try {
      setSavingEdit(true);
      const res = await api.put(`/resources/${editingResource.id}`, editForm);
      if (res.data?.success) {
        showToast('Resource updated successfully!', 'success');
        setResources((prev) =>
          prev.map((item) => (item.id === editingResource.id ? { ...item, ...res.data.resource } : item))
        );
        setEditingResource(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update resource.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingResource) return;

    try {
      setDeleting(true);
      const res = await api.delete(`/resources/${deletingResource.id}`);
      if (res.data?.success) {
        showToast('Resource deleted successfully.', 'info');
        setResources((prev) => prev.filter((r) => r.id !== deletingResource.id));
        setDeletingResource(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete resource.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.unit_name && r.unit_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Uploaded Resources</h1>
            <p style={styles.subtitle}>
              Manage, edit, and track downloads for study materials you contributed to the platform.
            </p>
          </div>
          <Link to="/upload" style={styles.uploadBtn}>
            <Upload size={17} />
            <span>Upload New Material</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div style={styles.searchBarWrapper}>
          <Search size={18} color="var(--text-secondary)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Filter your uploads by title, subject, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Resources Table / List */}
        {loading ? (
          <div style={styles.emptyCard}>Loading your uploaded materials...</div>
        ) : filteredResources.length === 0 ? (
          <div style={styles.emptyCard}>
            <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>No uploads found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '420px' }}>
              {searchQuery
                ? 'No materials matched your filter query. Try clearing the search bar.'
                : 'You have not uploaded any study materials yet. Help your juniors and peers by sharing lecture notes!'}
            </p>
            {!searchQuery && (
              <Link to="/upload" style={styles.uploadBtn}>
                <Upload size={16} />
                <span>Upload First Document</span>
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Document Title</th>
                    <th style={styles.th}>Subject & Course</th>
                    <th style={styles.th}>Type & Format</th>
                    <th style={styles.th}>Stats</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((res) => (
                    <tr key={res.id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link to={`/resources/${res.id}`} style={styles.resTitleLink}>
                          {res.title}
                        </Link>
                        {res.unit_name && <p style={styles.unitSub}>{res.unit_name}</p>}
                      </td>
                      <td style={styles.td}>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {res.subject_name}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {res.course_code} &bull; Sem {res.semester_number}
                        </p>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.typeBadge}>{res.resource_type}</span>
                        <span style={styles.formatBadge}>{res.file_type?.toUpperCase()}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={styles.statBadge}>
                            <Download size={13} /> {res.download_count}
                          </span>
                          <span style={styles.statBadge}>
                            <Star size={13} fill="#ED6C02" color="#ED6C02" />{' '}
                            {Number(res.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
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
                          {res.moderation_status === 'approved'
                            ? 'Approved'
                            : res.moderation_status === 'pending'
                            ? 'Pending'
                            : 'Hidden'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(res.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionBtnGroup}>
                          <Link
                            to={`/resources/${res.id}`}
                            style={styles.actionIconBtn}
                            title="View details"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </Link>
                          <button
                            onClick={() => openEditModal(res)}
                            style={styles.actionIconBtn}
                            title="Edit details"
                          >
                            <Edit2 size={16} color="#1E88E5" />
                          </button>
                          <button
                            onClick={() => setDeletingResource(res)}
                            style={styles.actionIconBtn}
                            title="Delete upload"
                          >
                            <Trash2 size={16} color="var(--error)" />
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

        {/* EDIT MODAL */}
        {editingResource && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Edit Resource Details</h3>
                <button onClick={() => setEditingResource(null)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={styles.modalForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Resource Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Description</label>
                  <textarea
                    rows="4"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    style={styles.textarea}
                    required
                  />
                </div>

                <div style={styles.gridRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Resource Type</label>
                    <select
                      value={editForm.resource_type}
                      onChange={(e) => setEditForm({ ...editForm, resource_type: e.target.value })}
                      style={styles.select}
                    >
                      {RESOURCE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Unit or Topic</label>
                    <input
                      type="text"
                      value={editForm.unit_name}
                      onChange={(e) => setEditForm({ ...editForm, unit_name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setEditingResource(null)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    style={{ ...styles.submitBtn, opacity: savingEdit ? 0.7 : 1 }}
                  >
                    {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {deletingResource && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '440px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={styles.deleteWarnIcon}>
                  <AlertTriangle size={24} color="var(--error)" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Delete Resource?</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Are you sure you want to permanently delete this document?
                  </p>
                </div>
              </div>

              <div style={styles.deletePreviewBox}>
                <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {deletingResource.title}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {deletingResource.subject_name} &bull; {deletingResource.download_count} downloads
                </p>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--error)', marginBottom: '1.5rem' }}>
                Warning: This will remove the file from ShelfShare servers and remove any bookmarks or
                collections associated with it. This action cannot be undone.
              </p>

              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setDeletingResource(null)}
                  style={styles.cancelBtn}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={styles.confirmDeleteBtn}
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '2rem',
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
  uploadBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.75rem 1.35rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 2px 8px rgba(23, 44, 64, 0.15)',
  },
  searchBarWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
    maxWidth: '520px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.6rem',
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
    transition: 'var(--transition)',
  },
  td: {
    padding: '1.1rem 1.25rem',
    verticalAlign: 'middle',
  },
  resTitleLink: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--primary)',
    display: 'block',
    marginBottom: '3px',
  },
  unitSub: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  typeBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
    marginRight: '6px',
  },
  formatBadge: {
    fontSize: '0.68rem',
    fontWeight: 700,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-secondary)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  statBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
  },
  actionBtnGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  actionIconBtn: {
    padding: '0.45rem',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-main)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-color)',
    padding: '3.5rem 1.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    maxWidth: '600px',
    width: '100%',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
    animation: 'slideIn 0.2s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
  },
  fieldLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '0.7rem 0.9rem',
    backgroundColor: '#FFFFFF',
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  modalActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.85rem',
    marginTop: '1rem',
  },
  cancelBtn: {
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '0.65rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.65rem 1.4rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    padding: '0.65rem 1.4rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
  deleteWarnIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'var(--error-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deletePreviewBox: {
    backgroundColor: 'var(--bg-main)',
    padding: '0.9rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    marginBottom: '1rem',
  },
};
