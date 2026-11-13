import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Github, Heart, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Col 1: Brand & About */}
        <div style={styles.col}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>
              <BookOpen size={20} color="#FFFFFF" />
            </div>
            <span style={styles.brandTitle}>ShelfShare</span>
          </div>
          <p style={styles.tagline}>Learn. Share. Grow.</p>
          <p style={styles.desc}>
            A centralized academic resource management ecosystem empowering college students to
            exchange lecture notes, question papers, revision guides, and lab code across semesters.
          </p>
          <div style={styles.badgeRow}>
            <span style={styles.mcaBadge}>
              <GraduationCap size={14} style={{ marginRight: '4px' }} />
              MCA Major Project
            </span>
            <span style={styles.techBadge}>Full-Stack MySQL</span>
          </div>
        </div>

        {/* Col 2: Platform Links */}
        <div style={styles.col}>
          <h4 style={styles.colHeading}>Explore Platform</h4>
          <ul style={styles.linkList}>
            <li>
              <Link to="/explore" style={styles.footerLink}>
                All Study Materials
              </Link>
            </li>
            <li>
              <Link to="/explore?type=Lecture+Notes" style={styles.footerLink}>
                Lecture Notes
              </Link>
            </li>
            <li>
              <Link to="/explore?type=Previous+Year+Question+Papers" style={styles.footerLink}>
                Previous Year Papers
              </Link>
            </li>
            <li>
              <Link to="/explore?type=Programming+Examples" style={styles.footerLink}>
                Programming Labs
              </Link>
            </li>
            <li>
              <Link to="/upload" style={styles.footerLink}>
                Upload Document
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Academic Courses */}
        <div style={styles.col}>
          <h4 style={styles.colHeading}>Supported Courses</h4>
          <ul style={styles.linkList}>
            <li>
              <Link to="/explore?course=1" style={styles.footerLink}>
                Master of Computer Applications (MCA)
              </Link>
            </li>
            <li>
              <Link to="/explore?course=2" style={styles.footerLink}>
                Bachelor of Computer Applications (BCA)
              </Link>
            </li>
            <li>
              <Link to="/explore?course=3" style={styles.footerLink}>
                B.Tech Computer Science & Eng.
              </Link>
            </li>
            <li>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Peer-to-Peer Semester Sharing
              </span>
            </li>
          </ul>
        </div>

        {/* Col 4: Project Info & Governance */}
        <div style={styles.col}>
          <h4 style={styles.colHeading}>Academic Standards</h4>
          <p style={{ ...styles.desc, marginBottom: '0.8rem' }}>
            Built with rigorous software engineering principles, parameterised relational queries,
            secure JWT cookie authentication, and document validation.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>Secure Student Data & Files</span>
          </div>
        </div>
      </div>

      <div style={styles.bottomBar}>
        <div style={styles.bottomContainer}>
          <p style={styles.copyright}>
            © {new Date().getFullYear()} ShelfShare Platform. Academic demonstration and evaluation.
          </p>
          <p style={styles.copyrightRight}>
            Designed with <Heart size={13} color="var(--error)" style={{ margin: '0 3px' }} /> for Collaborative Student Learning
          </p>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '3rem',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0 1.5rem 2.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2.5rem',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.4rem',
  },
  logoIcon: {
    backgroundColor: 'var(--primary)',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--primary)',
  },
  tagline: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--secondary)',
    marginBottom: '0.6rem',
  },
  desc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '1rem',
  },
  badgeRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  mcaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  techBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: 'var(--accent-light)',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  colHeading: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--primary)',
    marginBottom: '1rem',
    letterSpacing: '-0.2px',
  },
  linkList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
  },
  footerLink: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    transition: 'var(--transition)',
  },
  bottomBar: {
    borderTop: '1px solid var(--border-color)',
    padding: '1.2rem 1.5rem',
    backgroundColor: 'var(--bg-main)',
  },
  bottomContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  copyright: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  copyrightRight: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
};
