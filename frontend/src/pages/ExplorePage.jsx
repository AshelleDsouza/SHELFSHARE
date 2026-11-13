import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Compass,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowUpDown,
  FileQuestion,
} from 'lucide-react';
import ResourceCard from '../components/resources/ResourceCard';
import api from '../services/api';

const RESOURCE_TYPES = [
  'All Types',
  'Lecture Notes',
  'Handwritten Notes',
  'Previous Year Question Papers',
  'Assignments',
  'Presentations',
  'Programming Examples',
  'Reference Materials',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Uploaded' },
  { value: 'most_downloaded', label: 'Most Downloaded' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Query and Filter states from URL or defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || '');
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get('semester') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'recent');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Dynamic dropdown options
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Data states
  const [resources, setResources] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Load initial courses
  useEffect(() => {
    api
      .get('/academic/courses')
      .then((res) => {
        if (res.data?.courses) setCourses(res.data.courses);
      })
      .catch((err) => console.error(err));
  }, []);

  // Cascading semesters
  useEffect(() => {
    if (selectedCourse) {
      api
        .get(`/academic/courses/${selectedCourse}/semesters`)
        .then((res) => {
          if (res.data?.semesters) setSemesters(res.data.semesters);
        })
        .catch((err) => console.error(err));
    } else {
      setSemesters([]);
      setSelectedSemester('');
    }
  }, [selectedCourse]);

  // Cascading subjects
  useEffect(() => {
    if (selectedCourse && selectedSemester) {
      api
        .get(`/academic/subjects?course_id=${selectedCourse}&semester_id=${selectedSemester}`)
        .then((res) => {
          if (res.data?.subjects) setSubjects(res.data.subjects);
        })
        .catch((err) => console.error(err));
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedCourse, selectedSemester]);

  // Fetch resources when any filter or query changes
  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCourse) params.append('course_id', selectedCourse);
      if (selectedSemester) params.append('semester_id', selectedSemester);
      if (selectedSubject) params.append('subject_id', selectedSubject);
      if (selectedType && selectedType !== 'All Types') params.append('resource_type', selectedType);
      if (minRating) params.append('min_rating', minRating);
      if (sortOrder) params.append('sort', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', '9');

      // Update URL parameters
      setSearchParams(params, { replace: true });

      const res = await api.get(`/resources?${params.toString()}`);
      if (res.data?.success) {
        setResources(res.data.resources || []);
        setUserBookmarks(res.data.userBookmarks || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [
    searchQuery,
    selectedCourse,
    selectedSemester,
    selectedSubject,
    selectedType,
    minRating,
    sortOrder,
    currentPage,
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchResources();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedSemester('');
    setSelectedSubject('');
    setSelectedType('');
    setMinRating('');
    setSortOrder('recent');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedCourse) ||
    Boolean(selectedSemester) ||
    Boolean(selectedSubject) ||
    Boolean(selectedType && selectedType !== 'All Types') ||
    Boolean(minRating) ||
    sortOrder !== 'recent';

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>
            <Compass size={14} color="var(--primary)" />
            <span>Centralized Academic Catalog</span>
          </div>
          <h1 style={styles.title}>Explore Academic Resources</h1>
          <p style={styles.subtitle}>
            Search, filter, and discover study materials mapped by curriculum, semester, and course.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div style={styles.searchBarContainer}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <Search size={20} color="var(--text-secondary)" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by topic, keyword, subject name, or notes title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" style={styles.searchBtn}>
              Search
            </button>
          </form>

          <div style={styles.sortWrapper}>
            <ArrowUpDown size={16} color="var(--text-secondary)" />
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.sortSelect}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content: Filters Sidebar + Resource Grid */}
        <div style={styles.layout}>
          {/* Filters Sidebar */}
          <aside style={styles.filtersSidebar}>
            <div style={styles.filterHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={17} color="var(--primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Filters
                </h3>
              </div>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} style={styles.clearTextBtn}>
                  Reset All
                </button>
              )}
            </div>

            {/* Course Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Course / Degree</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.filterSelect}
              >
                <option value="">All Programs</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} - {c.course_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.filterSelect}
                disabled={!selectedCourse}
              >
                <option value="">
                  {!selectedCourse ? 'Select Program First' : 'All Semesters'}
                </option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    Semester {s.semester_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.filterSelect}
                disabled={!selectedSemester}
              >
                <option value="">
                  {!selectedSemester ? 'Select Semester First' : 'All Subjects'}
                </option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Resource Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.filterSelect}
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type === 'All Types' ? '' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Minimum Rating</label>
              <select
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.filterSelect}
              >
                <option value="">Any Rating</option>
                <option value="4.5">★ 4.5 and above</option>
                <option value="4.0">★ 4.0 and above</option>
                <option value="3.5">★ 3.5 and above</option>
              </select>
            </div>
          </aside>

          {/* Resources Catalog Grid */}
          <main style={styles.catalogMain}>
            <div style={styles.resultsInfoRow}>
              <span style={styles.resultsCount}>
                Showing <strong>{resources.length}</strong> of <strong>{pagination.total}</strong>{' '}
                resources
              </span>
            </div>

            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Searching verified study materials...
                </p>
              </div>
            ) : resources.length === 0 ? (
              <div style={styles.emptyStateCard}>
                <FileQuestion size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>
                  No study materials match your search
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.5rem' }}>
                  We couldn't find any resources matching the current filters. Try removing filters or
                  broadening your search term.
                </p>
                <button onClick={handleClearFilters} style={styles.resetBtn}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div style={styles.resourceGrid}>
                  {resources.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isBookmarked={userBookmarks.includes(res.id)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div style={styles.paginationRow}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      style={{
                        ...styles.pageBtn,
                        opacity: pagination.page <= 1 ? 0.5 : 1,
                        cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div style={styles.pageNumbers}>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          style={{
                            ...styles.pageNumberBtn,
                            backgroundColor:
                              num === pagination.page ? 'var(--primary)' : '#FFFFFF',
                            color: num === pagination.page ? '#FFFFFF' : 'var(--text-primary)',
                            fontWeight: num === pagination.page ? 700 : 500,
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      style={{
                        ...styles.pageBtn,
                        opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                        cursor:
                          pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
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
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--primary)',
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  searchBarContainer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  searchForm: {
    flex: 1,
    minWidth: '280px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.8rem 6.5rem 0.8rem 2.7rem',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '5.2rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  searchBtn: {
    position: 'absolute',
    right: '6px',
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.86rem',
    fontWeight: 600,
  },
  sortWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-color)',
    padding: '0.3rem 0.8rem',
    borderRadius: 'var(--radius-md)',
  },
  sortSelect: {
    border: 'none',
    padding: '0.45rem',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '270px 1fr',
    gap: '2rem',
  },
  filtersSidebar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    height: 'fit-content',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  clearTextBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  filterLabel: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  filterSelect: {
    width: '100%',
    padding: '0.6rem',
    fontSize: '0.85rem',
    backgroundColor: 'var(--bg-main)',
  },
  catalogMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  resultsInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-color)',
    padding: '4rem 1.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  resetBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.7rem 1.3rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.88rem',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '4rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2.5rem',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-color)',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary)',
  },
  pageNumbers: {
    display: 'flex',
    gap: '0.4rem',
  },
  pageNumberBtn: {
    width: '34px',
    height: '34px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
