import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Upload,
  Compass,
  Bookmark,
  Download,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ResourceCard from '../components/resources/ResourceCard';
import api from '../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalResourcesAvailable: 0,
    myUploadedResources: 0,
    myDownloads: 0,
    myBookmarks: 0,
  });
  const [overview, setOverview] = useState({
    recentlyUploaded: [],
    popularResources: [],
    recommended: [],
    recentActivity: [],
    bookmarkedIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, overviewRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/overview'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
      if (overviewRes.data?.success) {
        setOverview(overviewRes.data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Unable to fetch live dashboard records from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleBookmarkToggle = (resourceId, isSaved) => {
    setOverview((prev) => {
      const nextBookmarks = isSaved
        ? [...prev.bookmarkedIds, resourceId]
        : prev.bookmarkedIds.filter((id) => id !== resourceId);
      return { ...prev, bookmarkedIds: nextBookmarks };
    });
    // refresh stats
    setStats((prev) => ({
      ...prev,
      myBookmarks: isSaved ? prev.myBookmarks + 1 : Math.max(0, prev.myBookmarks - 1),
    }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* 1. WELCOME BANNER */}
        <div style={styles.welcomeBanner}>
          <div style={styles.welcomeText}>
            <div style={styles.welcomeBadge}>
              <Sparkles size={14} color="var(--primary)" />
              <span>
                {user?.course_code || 'MCA'} &bull; Semester {user?.semester_number || '1'} &bull;{' '}
                {user?.college_name || 'Academic Scholar'}
              </span>
            </div>
            <h1 style={styles.welcomeTitle}>Welcome back, {user?.full_name}!</h1>
            <p style={styles.welcomeSubtitle}>
              Your learning space is ready. What would you like to explore today?
            </p>
          </div>

          <div style={styles.quickActionsRow}>
            <Link to="/upload" style={styles.primaryActionBtn}>
              <Upload size={17} />
              <span>Upload Notes</span>
            </Link>
            <Link to="/explore" style={styles.secondaryActionBtn}>
              <Compass size={17} />
              <span>Explore</span>
            </Link>
            <Link to="/collections" style={styles.secondaryActionBtn}>
              <Layers size={17} />
              <span>My Library</span>
            </Link>
          </div>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} color="var(--error)" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. REAL DATABASE STATS CARDS */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: 'var(--secondary-light)' }}>
              <BookOpen size={22} color="var(--primary)" />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>
                {loading ? '...' : stats.totalResourcesAvailable}
              </span>
              <span style={styles.statTitle}>Total Resources Available</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: 'var(--accent-light)' }}>
              <Upload size={22} color="var(--primary)" />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>
                {loading ? '...' : stats.myUploadedResources}
              </span>
              <span style={styles.statTitle}>My Uploaded Resources</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#E8F5E9' }}>
              <Download size={22} color="var(--success)" />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>
                {loading ? '...' : stats.myDownloads}
              </span>
              <span style={styles.statTitle}>My Downloads</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#FFF3E0' }}>
              <Bookmark size={22} color="#ED6C02" />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>
                {loading ? '...' : stats.myBookmarks}
              </span>
              <span style={styles.statTitle}>My Bookmarks</span>
            </div>
          </div>
        </div>

        {/* 3. MAIN DASHBOARD CONTENT (Two columns: Feeds + Activity Sidebar) */}
        <div style={styles.dashboardLayout}>
          {/* Left Column: Resource Sections */}
          <div style={styles.mainFeed}>
            {/* RECOMMENDED FOR YOU */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <Sparkles size={20} color="var(--primary)" />
                  <h3 style={styles.sectionTitle}>Recommended for You</h3>
                </div>
                <span style={styles.sectionTagline}>
                  Curated for {user?.course_code} Sem {user?.semester_number}
                </span>
              </div>

              {loading ? (
                <div style={styles.loadingBox}>Loading recommendations...</div>
              ) : overview.recommended?.length === 0 ? (
                <div style={styles.emptyBox}>No recommendations available yet.</div>
              ) : (
                <div style={styles.resourceGrid}>
                  {overview.recommended.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isBookmarked={overview.bookmarkedIds.includes(res.id)}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* RECENTLY UPLOADED */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <Clock size={20} color="var(--primary)" />
                  <h3 style={styles.sectionTitle}>Recently Uploaded</h3>
                </div>
                <Link to="/explore" style={styles.viewAllLink}>
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {loading ? (
                <div style={styles.loadingBox}>Loading latest materials...</div>
              ) : (
                <div style={styles.resourceGrid}>
                  {overview.recentlyUploaded.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isBookmarked={overview.bookmarkedIds.includes(res.id)}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* POPULAR RESOURCES */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <TrendingUp size={20} color="#ED6C02" />
                  <h3 style={styles.sectionTitle}>Popular Resources</h3>
                </div>
                <Link to="/explore?sort=most_downloaded" style={styles.viewAllLink}>
                  <span>Most Downloaded</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {loading ? (
                <div style={styles.loadingBox}>Loading popular resources...</div>
              ) : (
                <div style={styles.resourceGrid}>
                  {overview.popularResources.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isBookmarked={overview.bookmarkedIds.includes(res.id)}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Recent Activity Feed & Academic Guidance */}
          <aside style={styles.sidebar}>
            {/* Recent Activity Feed */}
            <div style={styles.sidebarCard}>
              <div style={styles.sidebarCardHeader}>
                <Activity size={18} color="var(--primary)" />
                <h4 style={styles.sidebarTitle}>Recent Activity</h4>
              </div>

              {overview.recentActivity?.length === 0 ? (
                <div style={styles.emptyActivityBox}>
                  <FileText size={32} color="var(--text-muted)" />
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    No activity recorded yet.
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Start exploring notes or bookmark items to build your history!
                  </p>
                </div>
              ) : (
                <div style={styles.activityList}>
                  {overview.recentActivity.map((act, index) => (
                    <div key={index} style={styles.activityItem}>
                      <div
                        style={{
                          ...styles.activityDot,
                          backgroundColor:
                            act.activity_type === 'download'
                              ? 'var(--success)'
                              : act.activity_type === 'bookmark'
                              ? '#ED6C02'
                              : 'var(--primary)',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={styles.activityLabel}>
                          <strong>{act.action_label}</strong> &bull;{' '}
                          <Link to={`/resources/${act.resource_id}`} style={styles.activityTitle}>
                            {act.resource_title}
                          </Link>
                        </p>
                        <span style={styles.activityTime}>
                          {new Date(act.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Senior-to-Junior Resource Tips */}
            <div style={styles.seniorTipCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Senior Knowledge Sharing
                </h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Have you cleared your previous semesters? Upload your handwritten notes, lab
                programs, or solved question papers to earn recognition and help your juniors!
              </p>
              <Link to="/upload" style={styles.tipActionBtn}>
                Share Previous Semester Notes
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: 'var(--bg-main)',
    padding: '2rem 1.5rem 4rem',
    minHeight: 'calc(100vh - 140px)',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  welcomeText: {
    display: 'flex',
    flexDirection: 'column',
  },
  welcomeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--secondary-light)',
    padding: '3px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--primary)',
    marginBottom: '0.6rem',
    width: 'fit-content',
  },
  welcomeTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--primary)',
    letterSpacing: '-0.4px',
    marginBottom: '0.35rem',
  },
  welcomeSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  quickActionsRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.7rem 1.2rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.88rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    boxShadow: '0 2px 8px rgba(23, 44, 64, 0.15)',
  },
  secondaryActionBtn: {
    backgroundColor: 'var(--bg-main)',
    color: 'var(--primary)',
    border: '1px solid var(--border-color)',
    padding: '0.7rem 1.1rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.88rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  errorAlert: {
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error)',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    border: '1px solid #FFCDD2',
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '1.25rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--primary)',
    lineHeight: 1.1,
  },
  statTitle: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  dashboardLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '2rem',
  },
  mainFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--primary)',
    letterSpacing: '-0.3px',
  },
  sectionTagline: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  viewAllLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary)',
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sidebarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
  },
  sidebarCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  sidebarTitle: {
    fontSize: '0.98rem',
    fontWeight: 700,
    color: 'var(--primary)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0,
  },
  activityLabel: {
    fontSize: '0.84rem',
    color: 'var(--text-primary)',
    lineHeight: 1.35,
  },
  activityTitle: {
    color: 'var(--primary)',
    fontWeight: 500,
  },
  activityTime: {
    fontSize: '0.74rem',
    color: 'var(--text-muted)',
  },
  emptyActivityBox: {
    textAlign: 'center',
    padding: '1.5rem 0.5rem',
  },
  seniorTipCard: {
    backgroundColor: 'var(--accent-light)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
  },
  tipActionBtn: {
    display: 'inline-block',
    marginTop: '0.85rem',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--primary)',
    textDecoration: 'underline',
  },
  loadingBox: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
  },
  emptyBox: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--border-color)',
  },
};
