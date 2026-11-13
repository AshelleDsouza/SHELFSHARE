import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Upload,
  Compass,
  Bookmark,
  Star,
  Users,
  Download,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Sparkles,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import api from '../services/api';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalResources: 0,
    totalDownloads: 0,
    activeStudents: 0,
    totalCourses: 0,
  });
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/stats')
      .then((res) => {
        if (res.data && res.data.success) {
          setStats(res.data.stats);
          setFeaturedResources(res.data.featuredResources || []);
        }
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      {/* 1. HERO SECTION */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.heroTextCol}>
            <div style={styles.pillBadge}>
              <Sparkles size={14} color="var(--primary)" />
              <span>MCA Major Project &bull; Academic Resource Ecosystem</span>
            </div>
            <h1 style={styles.heroTitle}>
              Your Knowledge <br />
              Deserves a <span style={styles.highlightText}>Bigger Shelf.</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Discover, share and organise academic resources. Learn from seniors, help your juniors
              and grow together through a centralized peer-to-peer library.
            </p>
            <div style={styles.heroCtaRow}>
              <Link to="/explore" style={styles.primaryBtn}>
                <Compass size={18} />
                <span>Explore Resources</span>
              </Link>
              <Link
                to={isAuthenticated ? '/upload' : '/register'}
                style={styles.secondaryBtn}
              >
                <Upload size={18} />
                <span>Share Your Notes</span>
              </Link>
            </div>
            <div style={styles.trustRow}>
              <div style={styles.trustItem}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>Verified PDF Previews</span>
              </div>
              <div style={styles.trustItem}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>Course & Semester Mapped</span>
              </div>
              <div style={styles.trustItem}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>100% Free for Students</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup Preview */}
          <div style={styles.heroVisualCol}>
            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <div style={styles.previewHeaderLeft}>
                  <div style={styles.dotRed} />
                  <div style={styles.dotYellow} />
                  <div style={styles.dotGreen} />
                </div>
                <span style={styles.previewHeaderTitle}>ShelfShare Academic Library</span>
              </div>
              <div style={styles.previewBody}>
                <div style={styles.mockupSearchRow}>
                  <div style={styles.mockupSearchBar}>
                    <Compass size={15} color="var(--text-secondary)" />
                    <span>Search: Data Structures, DBMS, MCA Sem 2...</span>
                  </div>
                </div>

                <div style={styles.mockupResourceList}>
                  <div style={styles.mockupResourceItem}>
                    <div style={styles.mockupBadge}>MCA Sem 1</div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.mockupResTitle}>Binary Trees & AVL Rotations Complete Guide</p>
                      <p style={styles.mockupResMeta}>Aarav Sharma &bull; 42 downloads &bull; ★ 4.8</p>
                    </div>
                  </div>

                  <div style={styles.mockupResourceItem}>
                    <div style={{ ...styles.mockupBadge, backgroundColor: 'var(--accent-light)' }}>
                      MCA Sem 1
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.mockupResTitle}>Relational Normalization & ACID Transactions</p>
                      <p style={styles.mockupResMeta}>Priya Patel &bull; 38 downloads &bull; ★ 4.6</p>
                    </div>
                  </div>

                  <div style={styles.mockupResourceItem}>
                    <div style={{ ...styles.mockupBadge, backgroundColor: 'var(--secondary-light)' }}>
                      BCA Sem 4
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.mockupResTitle}>Python Practical Lab Manual with Pandas</p>
                      <p style={styles.mockupResMeta}>Karan Verma &bull; 64 downloads &bull; ★ 4.9</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL DATABASE STATS BAR */}
      <section style={styles.statsSection}>
        <div style={styles.statsContainer}>
          <div style={styles.statBox}>
            <span style={styles.statNumber}>{loading ? '...' : stats.totalResources}</span>
            <span style={styles.statLabel}>Academic Resources</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statBox}>
            <span style={styles.statNumber}>{loading ? '...' : stats.totalDownloads}</span>
            <span style={styles.statLabel}>Total Downloads</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statBox}>
            <span style={styles.statNumber}>{loading ? '...' : stats.activeStudents}</span>
            <span style={styles.statLabel}>Active Student Peers</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statBox}>
            <span style={styles.statNumber}>{loading ? '...' : stats.totalCourses}</span>
            <span style={styles.statLabel}>Programs Supported</span>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES */}
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionOverline}>WHY SHELFSHARE</span>
            <h2 style={styles.sectionTitle}>Everything You Need to Excel Academically</h2>
            <p style={styles.sectionSubtitle}>
              Designed specifically for college students to eliminate fragmented WhatsApp groups
              and drive collaborative learning.
            </p>
          </div>

          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIconBox, backgroundColor: 'var(--secondary-light)' }}>
                <Upload size={24} color="var(--primary)" />
              </div>
              <h3 style={styles.featureTitle}>1. Share Knowledge</h3>
              <p style={styles.featureDesc}>
                Upload lecture notes, practical programs, question papers, and revision guides. Help
                your peers and earn recognition within your college community.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIconBox, backgroundColor: 'var(--accent-light)' }}>
                <Compass size={24} color="var(--primary)" />
              </div>
              <h3 style={styles.featureTitle}>2. Discover Resources</h3>
              <p style={styles.featureDesc}>
                Instantly search and filter study materials mapped specifically by course, semester,
                subject code, and academic unit topic.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIconBox, backgroundColor: '#EBF3EF' }}>
                <Bookmark size={24} color="var(--primary)" />
              </div>
              <h3 style={styles.featureTitle}>3. Build Your Library</h3>
              <p style={styles.featureDesc}>
                Bookmark key materials and organize them into curated custom collections like "Finals
                Revision" or "DSA Exam Prep" for quick access.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIconBox, backgroundColor: '#F8F9F7' }}>
                <Star size={24} color="#ED6C02" />
              </div>
              <h3 style={styles.featureTitle}>4. Learn Together</h3>
              <p style={styles.featureDesc}>
                Read peer reviews, rate materials with 1 to 5 stars, and discover senior-to-junior
                recommended materials based on transparent quality formulas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section style={{ ...styles.section, backgroundColor: '#FFFFFF' }}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionOverline}>STREAMLINED WORKFLOW</span>
            <h2 style={styles.sectionTitle}>How ShelfShare Works</h2>
            <p style={styles.sectionSubtitle}>Four straightforward steps to collaborative academic success.</p>
          </div>

          <div style={styles.stepsGrid}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumberBadge}>1</div>
              <h4 style={styles.stepTitle}>Create Student Account</h4>
              <p style={styles.stepDesc}>
                Register with your college email, select your enrolled program (MCA, BCA, B.Tech) and current semester.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumberBadge}>2</div>
              <h4 style={styles.stepTitle}>Explore or Upload</h4>
              <p style={styles.stepDesc}>
                Discover notes mapped to your subjects or contribute verified documents with full metadata tagging.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumberBadge}>3</div>
              <h4 style={styles.stepTitle}>Preview & Save</h4>
              <p style={styles.stepDesc}>
                Inspect PDFs directly in the browser viewer, download offline copies, and bookmark into study collections.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumberBadge}>4</div>
              <h4 style={styles.stepTitle}>Share & Grow</h4>
              <p style={styles.stepDesc}>
                Rate quality, leave constructive feedback, and bridge the knowledge gap between seniors and juniors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED APPROVED RESOURCES PREVIEW */}
      {featuredResources.length > 0 && (
        <section style={styles.section}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionOverline}>POPULAR ON SHELFSHARE</span>
              <h2 style={styles.sectionTitle}>Top-Rated Academic Resources</h2>
              <p style={styles.sectionSubtitle}>
                Study materials with the highest student ratings and download counts.
              </p>
            </div>

            <div style={styles.resourceGrid}>
              {featuredResources.map((res) => (
                <Link to={`/resources/${res.id}`} key={res.id} style={styles.resourceCard}>
                  <div style={styles.resCardHeader}>
                    <span style={styles.resTypeBadge}>{res.resource_type}</span>
                    <span style={styles.resCourseBadge}>
                      {res.course_code} Sem {res.semester_number}
                    </span>
                  </div>
                  <h4 style={styles.resTitle}>{res.title}</h4>
                  <p style={styles.resSubject}>{res.subject_name}</p>
                  <div style={styles.resFooter}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={15} fill="#ED6C02" color="#ED6C02" />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {Number(res.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <Download size={14} />
                      <span style={{ fontSize: '0.85rem' }}>{res.download_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link to="/explore" style={styles.primaryBtn}>
                <span>View Full Library Catalog</span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 6. CALL TO ACTION BANNER */}
      <section style={styles.ctaBanner}>
        <div style={styles.ctaContainer}>
          <h2 style={styles.ctaTitle}>Ready to Upgrade Your Study Experience?</h2>
          <p style={styles.ctaSubtitle}>
            Join students across departments who are saving hours of exam prep by sharing knowledge.
          </p>
          <div style={styles.ctaBtnRow}>
            <Link to="/register" style={styles.ctaPrimaryBtn}>
              Create Student Account
            </Link>
            <Link to="/login" style={styles.ctaSecondaryBtn}>
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
  },
  heroSection: {
    backgroundColor: 'var(--bg-main)',
    padding: '4.5rem 1.5rem 4rem',
    borderBottom: '1px solid var(--border-color)',
  },
  heroContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '3.5rem',
    alignItems: 'center',
  },
  heroTextCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  pillBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-color)',
    padding: '0.4rem 0.9rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--primary)',
    marginBottom: '1.25rem',
    width: 'fit-content',
    boxShadow: 'var(--shadow-sm)',
  },
  heroTitle: {
    fontSize: '2.8rem',
    fontWeight: 800,
    color: 'var(--primary)',
    lineHeight: 1.15,
    letterSpacing: '-0.8px',
    marginBottom: '1.2rem',
  },
  highlightText: {
    color: 'var(--primary)',
    background: 'linear-gradient(180deg, transparent 65%, var(--secondary-light) 65%)',
    display: 'inline',
  },
  heroSubtitle: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '2rem',
    maxWidth: '540px',
  },
  heroCtaRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '2rem',
  },
  primaryBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.85rem 1.5rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.55rem',
    boxShadow: '0 4px 14px rgba(23, 44, 64, 0.2)',
    transition: 'var(--transition)',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    color: 'var(--primary)',
    border: '1.5px solid var(--border-color)',
    padding: '0.85rem 1.5rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.55rem',
    transition: 'var(--transition)',
  },
  trustRow: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  heroVisualCol: {
    display: 'flex',
    justifyContent: 'center',
  },
  previewCard: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  previewHeader: {
    backgroundColor: 'var(--bg-main)',
    padding: '0.8rem 1rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewHeaderLeft: {
    display: 'flex',
    gap: '6px',
  },
  dotRed: { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F56' },
  dotYellow: { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFBD2E' },
  dotGreen: { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27C93F' },
  previewHeaderTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  previewBody: {
    padding: '1.25rem',
  },
  mockupSearchRow: {
    marginBottom: '1rem',
  },
  mockupSearchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 0.9rem',
    backgroundColor: 'var(--bg-main)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  mockupResourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mockupResourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  },
  mockupBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    whiteSpace: 'nowrap',
  },
  mockupResTitle: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  mockupResMeta: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
  },
  statsSection: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '2.5rem 1.5rem',
  },
  statsContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2.4rem',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-0.5px',
    lineHeight: 1,
    marginBottom: '0.4rem',
  },
  statLabel: {
    fontSize: '0.88rem',
    color: 'var(--secondary)',
    fontWeight: 500,
  },
  statDivider: {
    width: '1px',
    height: '45px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  section: {
    padding: '4.5rem 1.5rem',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '650px',
    margin: '0 auto 3rem',
  },
  sectionOverline: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '1px',
    color: 'var(--secondary)',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.5rem',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--primary)',
    letterSpacing: '-0.5px',
    marginBottom: '0.75rem',
  },
  sectionSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
  },
  featureIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  featureTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--primary)',
    marginBottom: '0.65rem',
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.8rem',
  },
  stepCard: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-main)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
  },
  stepNumberBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  stepTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--primary)',
    marginBottom: '0.5rem',
  },
  stepDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.5rem',
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'var(--transition)',
  },
  resCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.8rem',
  },
  resTypeBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  resCourseBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-secondary)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  resTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--primary)',
    marginBottom: '0.4rem',
    lineHeight: 1.3,
  },
  resSubject: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.25rem',
  },
  resFooter: {
    marginTop: 'auto',
    paddingTop: '0.8rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaBanner: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '4.5rem 1.5rem',
    textAlign: 'center',
  },
  ctaContainer: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#FFFFFF',
    marginBottom: '1rem',
    letterSpacing: '-0.5px',
  },
  ctaSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--secondary)',
    marginBottom: '2rem',
    lineHeight: 1.6,
  },
  ctaBtnRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  ctaPrimaryBtn: {
    backgroundColor: '#FFFFFF',
    color: 'var(--primary)',
    padding: '0.85rem 1.8rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  ctaSecondaryBtn: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '1.5px solid rgba(255, 255, 255, 0.4)',
    padding: '0.85rem 1.8rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
};
