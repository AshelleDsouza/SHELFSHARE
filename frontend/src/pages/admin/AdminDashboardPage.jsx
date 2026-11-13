import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Download,
  Star,
  Flag,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#172C40', '#A9C9B8', '#DCD4F0', '#E57373', '#81C784', '#FFB74D', '#64B5F6'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeUsers: 0,
    totalResources: 0,
    totalDownloads: 0,
    totalReviews: 0,
    pendingReports: 0,
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState({
    uploadsByMonth: [],
    downloadsByMonth: [],
    popularSubjects: [],
    typeDistribution: [],
    studentRegistrations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/analytics')])
      .then(([dashRes, analyticsRes]) => {
        if (dashRes.data?.success) {
          setStats(dashRes.data.stats);
          setActivityLogs(dashRes.data.activityLogs || []);
        }
        if (analyticsRes.data?.success) {
          setAnalytics(analyticsRes.data.analytics);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Admin Navigation Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>
              <ShieldCheck size={14} color="#FFFFFF" />
              <span>Institutional Administration Portal</span>
            </div>
            <h1 style={styles.title}>ShelfShare Admin Console</h1>
            <p style={styles.subtitle}>
              Monitor platform health, analyze academic trends, manage user accounts, and resolve moderation reports.
            </p>
          </div>

          <div style={styles.quickNavRow}>
            <Link to="/admin/users" style={styles.quickNavLink}>
              <Users size={16} />
              <span>Users</span>
            </Link>
            <Link to="/admin/resources" style={styles.quickNavLink}>
              <FileText size={16} />
              <span>Resources</span>
            </Link>
            <Link to="/admin/reports" style={styles.quickNavLink}>
              <Flag size={16} />
              <span>Reports ({stats.pendingReports})</span>
            </Link>
            <Link to="/admin/subjects" style={styles.quickNavLink}>
              <BookOpen size={16} />
              <span>Subjects</span>
            </Link>
          </div>
        </div>

        {/* 1. REAL STATS SUMMARY CARDS */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: 'var(--secondary-light)' }}>
              <Users size={22} color="var(--primary)" />
            </div>
            <div>
              <span style={styles.statVal}>{loading ? '...' : stats.totalStudents}</span>
              <span style={styles.statLabel}>Registered Students</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: 'var(--accent-light)' }}>
              <FileText size={22} color="var(--primary)" />
            </div>
            <div>
              <span style={styles.statVal}>{loading ? '...' : stats.totalResources}</span>
              <span style={styles.statLabel}>Total Materials Uploaded</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#E8F5E9' }}>
              <Download size={22} color="var(--success)" />
            </div>
            <div>
              <span style={styles.statVal}>{loading ? '...' : stats.totalDownloads}</span>
              <span style={styles.statLabel}>Total Document Downloads</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#FFF3E0' }}>
              <Star size={22} color="#ED6C02" />
            </div>
            <div>
              <span style={styles.statVal}>{loading ? '...' : stats.totalReviews}</span>
              <span style={styles.statLabel}>Total Student Reviews</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#FFEBEE' }}>
              <Flag size={22} color="var(--error)" />
            </div>
            <div>
              <span style={styles.statVal}>{loading ? '...' : stats.pendingReports}</span>
              <span style={styles.statLabel}>Pending Reports</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#E0F2FE' }}>
              <UserCheck size={22} color="#0284C7" />
            </div>
            <div>
              <span style={styles.statVal}>{loading ? '...' : stats.activeUsers}</span>
              <span style={styles.statLabel}>Active Student Accounts</span>
            </div>
          </div>
        </div>

        {/* 2. RECHARTS VISUAL ANALYTICS */}
        <div style={styles.chartsGrid}>
          {/* Chart 1: Uploads per month */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <TrendingUp size={18} color="var(--primary)" />
              <h3 style={styles.chartTitle}>Monthly Resources Uploaded</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={analytics.uploadsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Uploads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Downloads Trend */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <Download size={18} color="var(--primary)" />
              <h3 style={styles.chartTitle}>Student Downloads Trend</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={analytics.downloadsByMonth}>
                  <defs>
                    <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#downloadGrad)"
                    name="Downloads"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Popular Subjects */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <BookOpen size={18} color="var(--primary)" />
              <h3 style={styles.chartTitle}>Most Downloaded Subjects</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={analytics.popularSubjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="subject"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11, fill: 'var(--text-primary)' }}
                  />
                  <Tooltip />
                  <Bar dataKey="downloads" fill="var(--secondary)" radius={[0, 4, 4, 0]} name="Total Downloads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Resource Type Distribution */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <Layers size={18} color="var(--primary)" />
              <h3 style={styles.chartTitle}>Resource Format Distribution</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={analytics.typeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analytics.typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. RECENT ADMIN AUDIT LOG */}
        <div style={styles.auditCard}>
          <div style={styles.auditHeader}>
            <Activity size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
              Recent Administrative Activity Logs
            </h3>
          </div>

          {activityLogs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No activity logged yet.</p>
          ) : (
            <div style={styles.logList}>
              {activityLogs.map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <span style={styles.actionPill}>{log.action}</span>
                  <div style={{ flex: 1 }}>
                    <p style={styles.logDetails}>{log.details}</p>
                    <span style={styles.logMeta}>
                      Logged by {log.admin_name} &bull; {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.78rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--primary)',
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    maxWidth: '680px',
  },
  quickNavRow: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  quickNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-color)',
    padding: '0.55rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
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
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statVal: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--primary)',
    display: 'block',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  chartTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--primary)',
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '1.75rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  auditHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  logItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.85rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  actionPill: {
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '2px 8px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    marginTop: '2px',
  },
  logDetails: {
    fontSize: '0.86rem',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  logMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
};
