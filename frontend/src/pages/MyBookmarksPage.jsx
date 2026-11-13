import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Bookmark,
  Search,
  Compass,
  FileText,
  Star,
  Download,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import ResourceCard from '../components/resources/ResourceCard';
import api from '../services/api';

export default function MyBookmarksPage() {
  const { showToast } = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookmarks');
      if (res.data?.success) {
        setBookmarks(res.data.bookmarks || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch bookmarks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (resourceId, isSaved) => {
    if (!isSaved) {
      setBookmarks((prev) => prev.filter((b) => b.id !== resourceId));
    }
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>
              <Bookmark size={14} color="var(--primary)" />
              <span>Saved Academic Library</span>
            </div>
            <h1 style={styles.title}>My Bookmarked Resources</h1>
            <p style={styles.subtitle}>
              Quickly revisit important notes, lecture slides, and question papers you saved for study.
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
            placeholder="Search through your saved bookmarks by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Bookmarks Grid */}
        {loading ? (
          <div style={styles.emptyCard}>Loading your saved bookmarks...</div>
        ) : filteredBookmarks.length === 0 ? (
          <div style={styles.emptyCard}>
            <Bookmark size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>
              {searchQuery ? 'No bookmarks match your query' : 'Your bookshelf is empty'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.5rem' }}>
              {searchQuery
                ? 'Try searching with different keywords.'
                : 'Save interesting study materials while browsing the catalog to build your personalized exam preparation bookshelf.'}
            </p>
            {!searchQuery && (
              <Link to="/explore" style={styles.exploreBtn}>
                <Compass size={16} />
                <span>Explore Catalog</span>
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredBookmarks.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                isBookmarked={true}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
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
