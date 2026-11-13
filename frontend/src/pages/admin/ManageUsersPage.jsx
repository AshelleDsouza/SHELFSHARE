import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

export default function ManageUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Change Dialog State
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  const confirmStatusChange = async () => {
    if (!selectedUser || !targetStatus) return;

    try {
      setUpdating(true);
      const res = await api.put(`/admin/users/${selectedUser.id}/status`, {
        status: targetStatus,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'User status updated.', 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, account_status: targetStatus } : u))
        );
        setSelectedUser(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/admin" style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Admin Console</span>
          </Link>
        </div>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Student User Management</h1>
            <p style={styles.subtitle}>
              Monitor registered academic scholars, verify college affiliations, and manage account statuses.
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="var(--text-secondary)" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by student name, email, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.selectGroup}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={styles.emptyCard}>Loading registered users...</div>
        ) : users.length === 0 ? (
          <div style={styles.emptyCard}>No users match the search filters.</div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Student Name & Email</th>
                    <th style={styles.th}>College & Curriculum</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Activity</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {u.full_name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</p>
                      </td>
                      <td style={styles.td}>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{u.college_name}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {u.course_code ? `${u.course_code} Sem ${u.semester_number}` : 'N/A'}
                        </p>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            backgroundColor:
                              u.role === 'admin' ? 'var(--primary)' : 'var(--secondary-light)',
                            color: u.role === 'admin' ? '#FFFFFF' : 'var(--primary)',
                          }}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <strong>{u.total_uploads}</strong> uploads &bull;{' '}
                          <strong>{u.total_downloads}</strong> downloads
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              u.account_status === 'active'
                                ? 'var(--success-bg)'
                                : u.account_status === 'suspended'
                                ? 'var(--error-bg)'
                                : 'var(--warning-bg)',
                            color:
                              u.account_status === 'active'
                                ? 'var(--success)'
                                : u.account_status === 'suspended'
                                ? 'var(--error)'
                                : 'var(--warning)',
                          }}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {u.role !== 'admin' && (
                          <div style={styles.actionRow}>
                            {u.account_status !== 'active' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setTargetStatus('active');
                                }}
                                style={styles.activateBtn}
                                title="Activate account"
                              >
                                <UserCheck size={14} />
                                <span>Activate</span>
                              </button>
                            )}

                            {u.account_status !== 'suspended' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setTargetStatus('suspended');
                                }}
                                style={styles.suspendBtn}
                                title="Suspend account"
                              >
                                <UserX size={14} />
                                <span>Suspend</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONFIRM STATUS MODAL */}
        {selectedUser && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Confirm Account Status Change</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.8rem 0 1.25rem' }}>
                Are you sure you want to change the status of <strong>{selectedUser.full_name}</strong> (
                {selectedUser.email}) to <strong style={{ textTransform: 'uppercase' }}>{targetStatus}</strong>?
              </p>

              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  style={styles.cancelBtn}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmStatusChange}
                  disabled={updating}
                  style={targetStatus === 'suspended' ? styles.confirmSuspendBtn : styles.confirmBtn}
                >
                  {updating ? 'Updating...' : `Confirm ${targetStatus}`}
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
  selectGroup: {
    display: 'flex',
    gap: '0.75rem',
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
  roleBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  statusBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    textTransform: 'capitalize',
  },
  actionRow: {
    display: 'inline-flex',
    gap: '0.4rem',
  },
  activateBtn: {
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
  suspendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error)',
    border: '1px solid #FFCDD2',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.78rem',
    fontWeight: 600,
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
    maxWidth: '440px',
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
  confirmSuspendBtn: {
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
};
