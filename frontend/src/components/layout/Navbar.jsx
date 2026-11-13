import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Upload,
  Compass,
  Bookmark,
  Layers,
  Bell,
  User,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import api from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      // Poll unread notifications
      api
        .get('/notifications/unread-count')
        .then((res) => {
          if (res.data && typeof res.data.count === 'number') {
            setUnreadNotifications(res.data.count);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Brand Logo */}
        <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/'} style={styles.logo}>
          <div style={styles.logoIcon}>
            <BookOpen size={22} color="#FFFFFF" />
          </div>
          <div style={styles.logoTextContainer}>
            <span style={styles.logoTitle}>ShelfShare</span>
            <span style={styles.logoTagline}>Academic Library</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={styles.desktopLinks}>
          <Link
            to="/"
            style={{
              ...styles.navLink,
              color: isActive('/') ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive('/') ? 600 : 500,
            }}
          >
            Home
          </Link>
          <Link
            to="/explore"
            style={{
              ...styles.navLink,
              color: isActive('/explore') ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive('/explore') ? 600 : 500,
            }}
          >
            <Compass size={17} style={{ marginRight: '4px' }} />
            Explore Resources
          </Link>

          {isAuthenticated && !isAdmin && (
            <>
              <Link
                to="/dashboard"
                style={{
                  ...styles.navLink,
                  color: isActive('/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive('/dashboard') ? 600 : 500,
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/collections"
                style={{
                  ...styles.navLink,
                  color: isActive('/collections') ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive('/collections') ? 600 : 500,
                }}
              >
                <Layers size={16} style={{ marginRight: '4px' }} />
                My Library
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              style={{
                ...styles.navLink,
                color: 'var(--primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldAlert size={17} color="var(--primary)" />
              Admin Portal
            </Link>
          )}
        </div>

        {/* Right CTA / Auth Controls */}
        <div style={styles.rightControls}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!isAdmin && (
                <Link to="/upload" style={styles.uploadBtn}>
                  <Upload size={16} />
                  <span>Upload Notes</span>
                </Link>
              )}

              {/* Notification Icon */}
              <Link to="/notifications" style={styles.iconBtn} title="Notifications">
                <Bell size={20} color="var(--text-primary)" />
                {unreadNotifications > 0 && (
                  <span style={styles.badge}>{unreadNotifications}</span>
                )}
              </Link>

              {/* User Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={styles.userProfileTrigger}
                >
                  <div style={styles.avatar}>
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={styles.userName}>{user?.full_name?.split(' ')[0]}</span>
                  <ChevronDown size={14} color="var(--text-secondary)" />
                </button>

                {userDropdownOpen && (
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownHeader}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {user?.full_name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {user?.email}
                      </p>
                      <span style={styles.roleBadge}>
                        {user?.role === 'admin' ? 'Administrator' : `${user?.course_code || 'Student'} (Sem ${user?.semester_number || '1'})`}
                      </span>
                    </div>
                    <div style={styles.dropdownDivider} />

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      style={styles.dropdownItem}
                    >
                      <User size={16} />
                      Profile & Activity
                    </Link>

                    {!isAdmin && (
                      <>
                        <Link
                          to="/my-uploads"
                          onClick={() => setUserDropdownOpen(false)}
                          style={styles.dropdownItem}
                        >
                          <Upload size={16} />
                          My Uploads
                        </Link>
                        <Link
                          to="/my-bookmarks"
                          onClick={() => setUserDropdownOpen(false)}
                          style={styles.dropdownItem}
                        >
                          <Bookmark size={16} />
                          My Bookmarks
                        </Link>
                      </>
                    )}

                    <div style={styles.dropdownDivider} />
                    <button
                      onClick={handleLogout}
                      style={{ ...styles.dropdownItem, color: 'var(--error)' }}
                    >
                      <LogOut size={16} color="var(--error)" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" style={styles.loginBtn}>
                Sign In
              </Link>
              <Link to="/register" style={styles.registerBtn}>
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.mobileToggleBtn}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
            Home
          </Link>
          <Link to="/explore" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
            Explore Resources
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
                Dashboard
              </Link>
              <Link to="/upload" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
                Upload Notes
              </Link>
              <Link to="/collections" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
                My Library
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
                Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                style={{ ...styles.mobileMenuItem, color: 'var(--error)', background: 'none', textAlign: 'left', width: '100%' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuItem}>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0.8rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoIcon: {
    backgroundColor: 'var(--primary)',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(23, 44, 64, 0.2)',
  },
  logoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--primary)',
    letterSpacing: '-0.3px',
    lineHeight: 1.1,
  },
  logoTagline: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    fontWeight: 500,
  },
  desktopLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.8rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.92rem',
    transition: 'var(--transition)',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
  },
  uploadBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.55rem 1rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.88rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    transition: 'var(--transition)',
    boxShadow: '0 2px 6px rgba(23, 44, 64, 0.15)',
  },
  loginBtn: {
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    fontWeight: 600,
    padding: '0.5rem 0.9rem',
  },
  registerBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.55rem 1.15rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  iconBtn: {
    position: 'relative',
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
  },
  badge: {
    position: 'absolute',
    top: '3px',
    right: '3px',
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    fontSize: '0.68rem',
    fontWeight: 700,
    borderRadius: '10px',
    minWidth: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
  userProfileTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--secondary)',
    color: 'var(--primary)',
    fontWeight: 700,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: '125%',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
    width: '230px',
    padding: '0.5rem 0',
    zIndex: 200,
  },
  dropdownHeader: {
    padding: '0.75rem 1rem',
  },
  roleBadge: {
    display: 'inline-block',
    marginTop: '4px',
    padding: '2px 8px',
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    fontSize: '0.72rem',
    fontWeight: 600,
    borderRadius: '4px',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '0.4rem 0',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.6rem 1rem',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    width: '100%',
    boxSizing: 'border-box',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  mobileToggleBtn: {
    display: 'none', // Handled via CSS media query
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--primary)',
  },
  mobileMenu: {
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid var(--border-color)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  mobileMenuItem: {
    padding: '0.5rem 0',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
  },
};
