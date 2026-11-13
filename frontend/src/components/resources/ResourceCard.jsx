import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Star,
  Download,
  Bookmark,
  Calendar,
  User,
  ExternalLink,
  Layers,
} from 'lucide-react';
import api from '../../services/api';

export default function ResourceCard({ resource, isBookmarked: initialBookmarked = false, onBookmarkToggle }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please sign in to bookmark study materials.', 'info');
      return;
    }

    try {
      setBookmarkLoading(true);
      if (bookmarked) {
        await api.delete(`/bookmarks/${resource.id}`);
        setBookmarked(false);
        showToast('Resource removed from bookmarks.', 'info');
        if (onBookmarkToggle) onBookmarkToggle(resource.id, false);
      } else {
        await api.post(`/bookmarks/${resource.id}`);
        setBookmarked(true);
        showToast('Resource saved to bookmarks!', 'success');
        if (onBookmarkToggle) onBookmarkToggle(resource.id, true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update bookmark.', 'error');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const getFormatBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return '#E53935';
      case 'docx':
      case 'doc':
        return '#1E88E5';
      case 'pptx':
      case 'ppt':
        return '#FB8C00';
      default:
        return 'var(--primary)';
    }
  };

  return (
    <div style={styles.card}>
      {/* Top Header: Resource Type & Course Tag */}
      <div style={styles.header}>
        <div style={styles.badgeRow}>
          <span style={styles.typeBadge}>{resource.resource_type || 'Lecture Notes'}</span>
          <span style={styles.courseBadge}>
            {resource.course_code || 'MCA'} Sem {resource.semester_number || '1'}
          </span>
          {resource.quality && (
            <span
              style={{
                ...styles.qualityBadge,
                backgroundColor: resource.quality.bg || 'var(--secondary-light)',
                color: resource.quality.color || 'var(--primary)',
              }}
            >
              {resource.quality.label}
            </span>
          )}
        </div>

        {/* Bookmark Action */}
        <button
          onClick={handleBookmarkClick}
          disabled={bookmarkLoading}
          style={styles.bookmarkBtn}
          title={bookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
        >
          <Bookmark
            size={17}
            color={bookmarked ? 'var(--primary)' : 'var(--text-secondary)'}
            fill={bookmarked ? 'var(--primary)' : 'none'}
          />
        </button>
      </div>

      {/* Resource Title & Details Link */}
      <Link to={`/resources/${resource.id}`} style={styles.titleLink}>
        <h4 style={styles.title}>{resource.title}</h4>
      </Link>

      <p style={styles.subject}>{resource.subject_name}</p>

      {resource.unit_name && (
        <p style={styles.unitText}>{resource.unit_name}</p>
      )}

      {/* Meta Row: Uploader and Date */}
      <div style={styles.metaRow}>
        <div style={styles.metaItem}>
          <User size={13} color="var(--text-secondary)" />
          <span>{resource.uploader_name || 'Senior Peer'}</span>
        </div>
        <div style={styles.metaItem}>
          <span
            style={{
              ...styles.formatBadge,
              backgroundColor: `${getFormatBadgeColor(resource.file_type)}15`,
              color: getFormatBadgeColor(resource.file_type),
            }}
          >
            {resource.file_type?.toUpperCase() || 'PDF'}
          </span>
        </div>
      </div>

      {/* Footer: Rating, Downloads & Action */}
      <div style={styles.footer}>
        <div style={styles.statsRow}>
          <div style={styles.ratingBadge}>
            <Star size={13} fill="#ED6C02" color="#ED6C02" />
            <span>{Number(resource.average_rating || 0).toFixed(1)}</span>
          </div>
          <div style={styles.downloadStat}>
            <Download size={13} />
            <span>{resource.download_count || 0}</span>
          </div>
        </div>

        <Link to={`/resources/${resource.id}`} style={styles.viewBtn}>
          <span>View Details</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  typeBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  courseBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-secondary)',
    padding: '3px 7px',
    borderRadius: '4px',
  },
  qualityBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '4px',
  },
  bookmarkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLink: {
    color: 'inherit',
    marginBottom: '0.35rem',
  },
  title: {
    fontSize: '0.98rem',
    fontWeight: 700,
    color: 'var(--primary)',
    lineHeight: 1.35,
  },
  subject: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginBottom: '0.35rem',
  },
  unitText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginBottom: '0.8rem',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-color)',
    marginBottom: '0.75rem',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  formatBadge: {
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.5rem',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  ratingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  downloadStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--primary)',
    backgroundColor: 'var(--bg-main)',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)',
  },
};
