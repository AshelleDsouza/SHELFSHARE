import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Download,
  FileText,
  Search,
  Calendar,
  Star,
  ExternalLink,
  Compass,
  ArrowRight,
  Clock,
} from 'lucide-react';
import api from '../services/api';

export default function MyDownloadsPage() {
  const { showToast } = useToast();
  const [downloads, setDownloads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDownloadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/downloads/history');
      if (res.data?.success) {
        setDownloads(res.data.downloads || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load download history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloadHistory();
  }, []);

  const handleReDownload = async (resourceId, fileName) => {
    try {
      showToast('Re-downloading document...', 'info');
      const response = await api.get(`/resources/${resourceId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast('Download started!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to re-download.', 'error');
    }
  };

  const filteredDownloads = downloads.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>
              <Download size={14} color="var(--primary)" />
              <span>Offline Study History</span>
            </div>
            <h1 style={styles.title}>My Downloaded Materials</h1>
            <p style={styles.subtitle}>
              Keep track of materials downloaded for offline study, revision, and exam preparation.
            </p>
          </div>
          <Link to="/explore" style={styles.exploreBtn}>
            <Compass size={17} />
            <span>Discover More Notes</span>
          </Link>
        </div>

        {/* Search Filter */}
        <div style={styles.searchBarWrapper}>
          <Search size={18} color="var(--text-secondary)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search through downloaded files by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.emptyCard}>Loading your download history...</div>
        ) : filteredDownloads.length === 0 ? (
          <div style={styles.emptyCard}>
            <Download size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>
              {searchQuery ? 'No matching downloads found' : 'No downloads yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.5rem' }}>
              {searchQuery
                ? 'Try adjusting your search keywords.'
                : 'You have not downloaded any documents yet. Explore our academic library to find notes for your subjects.'}
            </p>
            {!searchQuery && (
              <Link to="/explore" style={styles.exploreBtn}>
                <Compass size={16} />
                <span>Explore Academic Resources</span>
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Resource Title</th>
                    <th style={styles.th}>Subject & Course</th>
                    <th style={styles.th}>Format</th>
                    <th style={styles.th}>Uploader</th>
                    <th style={styles.th}>Downloaded At</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDownloads.map((item) => (
                    <tr key={item.download_id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link to={`/resources/${item.resource_id}`} style={styles.resTitleLink}>
                          {item.title}
                        </Link>
                        <span style={styles.typeSub}>{item.resource_type}</span>
                      </td>
                      <td style={styles.td}>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {item.subject_name}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {item.course_code} &bull; Sem {item.semester_number}
                        </p>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.formatBadge}>
                          {item.file_type?.toUpperCase()} ({(item.file_size / 1024).toFixed(0)} KB)
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {item.uploader_name}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          <Clock size={13} />
                          <span>{new Date(item.downloaded_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionBtnGroup}>
                          <button
                            onClick={() => handleReDownload(item.resource_id, item.file_name)}
                            style={styles.reDownloadBtn}
                            title="Download again"
                          >
                            <Download size={14} />
                            <span>Download Again</span>
                          </button>
                          <Link
                            to={`/resources/${item.resource_id}`}
                            style={styles.detailsIconBtn}
                            title="View details"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--secondary-light)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--primary)',
    marginBottom: '0.5rem',
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
  exploreBtn: {
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
    marginBottom: '2px',
  },
  typeSub: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
  },
  formatBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-secondary)',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  actionBtnGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  reDownloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    border: '1px solid var(--secondary)',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  detailsIconBtn: {
    padding: '0.4rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-color)',
    padding: '4rem 1.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
};
