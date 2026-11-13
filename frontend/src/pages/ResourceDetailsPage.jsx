import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Download,
  Bookmark,
  Star,
  Eye,
  Share2,
  Flag,
  User,
  Calendar,
  Building,
  GraduationCap,
  Layers,
  Tag,
  CheckCircle2,
  AlertTriangle,
  X,
  MessageSquare,
  Send,
  ArrowLeft,
} from 'lucide-react';
import ResourceCard from '../components/resources/ResourceCard';
import api from '../services/api';

const REPORT_REASONS = [
  'Incorrect content',
  'Duplicate material',
  'Copyright concern',
  'Inappropriate content',
  'Broken or corrupted file',
  'Other',
];

export default function ResourceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [resource, setResource] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [relatedResources, setRelatedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // PDF Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);

  // Review Form State
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report Modal State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/resources/${id}`);
      if (res.data?.success) {
        setResource(res.data.resource);
        setIsBookmarked(res.data.isBookmarked);
        setReviews(res.data.reviews || []);
        setRelatedResources(res.data.relatedResources || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load resource details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceDetails();
    window.scrollTo(0, 0);
  }, [id]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to bookmark this document.', 'info');
      navigate('/login');
      return;
    }

    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${id}`);
        setIsBookmarked(false);
        showToast('Resource removed from bookmarks.', 'info');
      } else {
        await api.post(`/bookmarks/${id}`);
        setIsBookmarked(true);
        showToast('Resource bookmarked successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to toggle bookmark.', 'error');
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to download study materials.', 'info');
      navigate('/login');
      return;
    }

    try {
      setDownloading(true);
      // Trigger authenticated download endpoint (which increments download counter in MySQL)
      const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/resources/${id}/download`;

      // Use an anchor tag or direct window download
      const response = await api.get(`/resources/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', resource.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      showToast('Download started successfully!', 'success');
      // Increment local count
      setResource((prev) => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
    } catch (err) {
      showToast(err.message || 'Failed to download document.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to leave a review.', 'info');
      return;
    }

    if (!userComment.trim()) {
      showToast('Please write a short comment about this material.', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post(`/resources/${id}/reviews`, {
        rating: userRating,
        comment: userComment,
      });

      if (res.data?.success) {
        showToast('Review submitted successfully!', 'success');
        setUserComment('');
        fetchResourceDetails();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to report content.', 'info');
      return;
    }

    try {
      setSubmittingReport(true);
      const res = await api.post('/reports', {
        resource_id: id,
        reason: reportReason,
        description: reportDesc,
      });

      if (res.data?.success) {
        showToast('Report submitted to administrators for review.', 'info');
        setReportOpen(false);
        setReportDesc('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading resource details...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Resource Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The requested study material does not exist or has been removed.
        </p>
        <Link to="/explore" style={styles.backBtn}>
          Back to Explore
        </Link>
      </div>
    );
  }

  const isPdf = resource.file_type?.toLowerCase() === 'pdf';
  const previewUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/resources/${id}/preview`;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Navigation Breadcrumb */}
        <div style={styles.breadcrumb}>
          <Link to="/explore" style={styles.breadcrumbLink}>
            <ArrowLeft size={16} />
            <span>Back to Catalog</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{resource.course_code}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{resource.title}</span>
        </div>

        {/* Resource Header Card */}
        <div style={styles.headerCard}>
          <div style={styles.headerTop}>
            <div style={styles.badgeRow}>
              <span style={styles.typeBadge}>{resource.resource_type}</span>
              <span style={styles.courseBadge}>
                {resource.course_code} &bull; Semester {resource.semester_number}
              </span>
              <span style={styles.formatBadge}>{resource.file_type?.toUpperCase()} Document</span>
            </div>

            <button onClick={() => setReportOpen(true)} style={styles.reportTriggerBtn}>
              <Flag size={14} />
              <span>Report Resource</span>
            </button>
          </div>

          <h1 style={styles.resourceTitle}>{resource.title}</h1>
          <p style={styles.subjectSubtitle}>
            {resource.subject_code} - {resource.subject_name}
          </p>

          {/* Key Metrics Row */}
          <div style={styles.metricsRow}>
            <div style={styles.metricItem}>
              <Star size={18} fill="#ED6C02" color="#ED6C02" />
              <span style={styles.metricVal}>
                {Number(resource.average_rating || 0).toFixed(1)}
              </span>
              <span style={styles.metricSub}>({resource.total_reviews} reviews)</span>
            </div>
            <div style={styles.metricDivider} />
            <div style={styles.metricItem}>
              <Download size={18} color="var(--primary)" />
              <span style={styles.metricVal}>{resource.download_count}</span>
              <span style={styles.metricSub}>downloads</span>
            </div>
            <div style={styles.metricDivider} />
            <div style={styles.metricItem}>
              <Calendar size={18} color="var(--text-secondary)" />
              <span style={styles.metricSub}>
                Added on {new Date(resource.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div style={styles.actionBar}>
            {isPdf ? (
              <button onClick={() => setPreviewOpen(true)} style={styles.previewBtn}>
                <Eye size={18} />
                <span>Preview PDF in Viewer</span>
              </button>
            ) : (
              <div style={styles.noPreviewBadge}>
                <FileText size={16} />
                <span>{resource.file_type?.toUpperCase()} format (Download to view)</span>
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading}
              style={styles.downloadBtn}
            >
              <Download size={18} />
              <span>{downloading ? 'Preparing Download...' : 'Download Resource'}</span>
            </button>

            <button
              onClick={handleBookmarkToggle}
              style={{
                ...styles.bookmarkBtn,
                backgroundColor: isBookmarked ? 'var(--secondary-light)' : '#FFFFFF',
                color: isBookmarked ? 'var(--primary)' : 'var(--text-primary)',
              }}
            >
              <Bookmark
                size={18}
                fill={isBookmarked ? 'var(--primary)' : 'none'}
                color="var(--primary)"
              />
              <span>{isBookmarked ? 'Saved in Bookmarks' : 'Bookmark'}</span>
            </button>
          </div>
        </div>

        {/* Details & Reviews Grid */}
        <div style={styles.contentGrid}>
          {/* Main Column */}
          <div style={styles.mainCol}>
            {/* Description Card */}
            <div style={styles.card}>
              <h3 style={styles.cardSectionTitle}>Resource Description</h3>
              <p style={styles.descText}>{resource.description}</p>

              {resource.unit_name && (
                <div style={styles.infoMetaBlock}>
                  <strong>Target Syllabus Unit:</strong> {resource.unit_name}
                </div>
              )}

              {/* Tags */}
              {resource.tags && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Tag size={15} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Search Tags:
                    </span>
                  </div>
                  <div style={styles.tagChips}>
                    {resource.tags.split(',').map((tag, idx) => (
                      <span key={idx} style={styles.tagChip}>
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RATINGS & REVIEWS SECTION */}
            <div style={styles.card}>
              <div style={styles.reviewsHeader}>
                <div>
                  <h3 style={styles.cardSectionTitle}>Student Ratings & Reviews</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    Genuine feedback from students who studied this material.
                  </p>
                </div>
                <div style={styles.avgRatingBadge}>
                  <Star size={20} fill="#ED6C02" color="#ED6C02" />
                  <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                    {Number(resource.average_rating || 0).toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>/ 5</span>
                </div>
              </div>

              {/* Write Review Form */}
              <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Leave Your Academic Review
                </h4>
                <div style={styles.starSelectRow}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Your Rating:
                  </span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      style={styles.starBtn}
                    >
                      <Star
                        size={22}
                        fill={star <= userRating ? '#ED6C02' : 'none'}
                        color={star <= userRating ? '#ED6C02' : 'var(--text-muted)'}
                      />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ED6C02', marginLeft: '6px' }}>
                    {userRating} Star{userRating > 1 ? 's' : ''}
                  </span>
                </div>

                <textarea
                  rows="3"
                  placeholder="Share how this material helped your study or exam revision..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  style={styles.reviewTextarea}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    style={styles.submitReviewBtn}
                  >
                    <Send size={15} />
                    <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div style={styles.reviewsList}>
                {reviews.length === 0 ? (
                  <div style={styles.emptyReviews}>
                    <MessageSquare size={32} color="var(--text-muted)" />
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      No reviews written yet. Be the first student to review this material!
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} style={styles.reviewItem}>
                      <div style={styles.reviewItemHeader}>
                        <div style={styles.reviewerAvatar}>
                          {rev.reviewer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={styles.reviewerName}>{rev.reviewer_name}</p>
                          <p style={styles.reviewerCollege}>{rev.reviewer_college || 'Student Peer'}</p>
                        </div>
                        <div style={styles.reviewStars}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? '#ED6C02' : 'none'}
                              color={i < rev.rating ? '#ED6C02' : 'var(--text-muted)'}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={styles.reviewComment}>{rev.comment}</p>
                      <span style={styles.reviewDate}>
                        {new Date(rev.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column: Uploader Info & Related Notes */}
          <aside style={styles.sidebarCol}>
            {/* Uploader Card */}
            <div style={styles.card}>
              <h4 style={styles.sidebarCardTitle}>Uploaded By Senior Peer</h4>
              <div style={styles.uploaderBox}>
                <div style={styles.uploaderLargeAvatar}>
                  {resource.uploader_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 style={styles.uploaderTitle}>{resource.uploader_name}</h5>
                  <p style={styles.uploaderCollege}>{resource.uploader_college}</p>
                  <span style={styles.contributorPill}>Verified Contributor</span>
                </div>
              </div>
            </div>

            {/* Document Details Card */}
            <div style={styles.card}>
              <h4 style={styles.sidebarCardTitle}>Document Metadata</h4>
              <ul style={styles.metaList}>
                <li style={styles.metaListItem}>
                  <span>File Name:</span>
                  <strong>{resource.file_name}</strong>
                </li>
                <li style={styles.metaListItem}>
                  <span>File Size:</span>
                  <strong>{(resource.file_size / 1024).toFixed(1)} KB</strong>
                </li>
                <li style={styles.metaListItem}>
                  <span>Academic Year:</span>
                  <strong>{resource.academic_year || '2025-2026'}</strong>
                </li>
                <li style={styles.metaListItem}>
                  <span>Quality Score:</span>
                  <span style={styles.qualityPill}>
                    {Number(resource.average_rating) >= 4.5 ? 'Highly Rated' : 'Peer Verified'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Related Resources in Subject */}
            {relatedResources.length > 0 && (
              <div style={styles.card}>
                <h4 style={styles.sidebarCardTitle}>More in {resource.subject_name}</h4>
                <div style={styles.relatedList}>
                  {relatedResources.map((rel) => (
                    <Link to={`/resources/${rel.id}`} key={rel.id} style={styles.relatedItem}>
                      <FileText size={16} color="var(--primary)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={styles.relatedTitle}>{rel.title}</p>
                        <p style={styles.relatedMeta}>
                          ★ {Number(rel.average_rating).toFixed(1)} &bull; {rel.download_count} downloads
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* PDF PREVIEW MODAL */}
        {previewOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.previewModalContent}>
              <div style={styles.previewModalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Eye size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                    PDF Preview: {resource.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={handleDownload} style={styles.modalDownloadBtn}>
                    <Download size={15} />
                    <span>Download</span>
                  </button>
                  <button onClick={() => setPreviewOpen(false)} style={styles.closeBtn}>
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Embedded PDF Viewer */}
              <div style={styles.pdfViewerContainer}>
                <iframe
                  src={previewUrl}
                  title="PDF Document Viewer"
                  style={styles.pdfIframe}
                />
              </div>
            </div>
          </div>
        )}

        {/* REPORT RESOURCE MODAL */}
        {reportOpen && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '480px' }}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flag size={18} color="var(--error)" />
                  <h3 style={styles.modalTitle}>Report Resource</h3>
                </div>
                <button onClick={() => setReportOpen(false)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} style={styles.modalForm}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Help maintain academic integrity on ShelfShare. Select the primary reason for reporting:
                </p>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={styles.select}
                  >
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Additional Details (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Describe specific discrepancies, errors, or copyright concerns..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    style={styles.confirmReportBtn}
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
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
    padding: '2rem 1.5rem 5rem',
    minHeight: 'calc(100vh - 140px)',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.86rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: 'var(--primary)',
    fontWeight: 600,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '2rem',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  badgeRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  typeBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  courseBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  formatBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: 'var(--accent-light)',
    color: 'var(--primary)',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  reportTriggerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: 'none',
    border: 'none',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  resourceTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: 'var(--primary)',
    lineHeight: 1.25,
    marginBottom: '0.4rem',
    letterSpacing: '-0.5px',
  },
  subjectSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginBottom: '1.5rem',
  },
  metricsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem 0',
    borderTop: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
  },
  metricItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  metricVal: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  metricSub: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  metricDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border-color)',
  },
  actionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  previewBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.85rem 1.6rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: '0.92rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 3px 10px rgba(23, 44, 64, 0.2)',
    cursor: 'pointer',
    border: 'none',
  },
  downloadBtn: {
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    border: '1px solid var(--secondary)',
    padding: '0.85rem 1.5rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: '0.92rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  bookmarkBtn: {
    border: '1px solid var(--border-color)',
    padding: '0.85rem 1.4rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.92rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  noPreviewBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    padding: '0.85rem 1.25rem',
    backgroundColor: 'var(--bg-main)',
    borderRadius: 'var(--radius-full)',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '2rem',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--primary)',
    marginBottom: '1rem',
  },
  descText: {
    fontSize: '0.96rem',
    lineHeight: 1.7,
    color: 'var(--text-primary)',
    whiteSpace: 'pre-line',
  },
  infoMetaBlock: {
    marginTop: '1.25rem',
    padding: '0.8rem 1rem',
    backgroundColor: 'var(--bg-main)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  tagChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  tagChip: {
    fontSize: '0.76rem',
    fontWeight: 600,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--primary)',
    padding: '3px 9px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  reviewsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
    marginBottom: '1.5rem',
  },
  avgRatingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#FFF3E0',
    padding: '0.5rem 0.9rem',
    borderRadius: 'var(--radius-md)',
  },
  reviewForm: {
    backgroundColor: 'var(--bg-main)',
    padding: '1.25rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    marginBottom: '2rem',
  },
  starSelectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    margin: '0.75rem 0',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
  },
  reviewTextarea: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  submitReviewBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.65rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.86rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    cursor: 'pointer',
    border: 'none',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  emptyReviews: {
    textAlign: 'center',
    padding: '2rem 1rem',
  },
  reviewItem: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.2rem',
  },
  reviewItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.6rem',
  },
  reviewerAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'var(--secondary)',
    color: 'var(--primary)',
    fontWeight: 700,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerName: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  reviewerCollege: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  reviewStars: {
    display: 'flex',
    gap: '2px',
  },
  reviewComment: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    marginBottom: '0.35rem',
  },
  reviewDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sidebarCardTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--primary)',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.6rem',
  },
  uploaderBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
  },
  uploaderLargeAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    fontWeight: 800,
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploaderTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  uploaderCollege: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  contributorPill: {
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--primary)',
    padding: '2px 7px',
    borderRadius: '4px',
  },
  metaList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    fontSize: '0.86rem',
  },
  metaListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityPill: {
    fontSize: '0.72rem',
    fontWeight: 700,
    backgroundColor: '#E8F5E9',
    color: 'var(--success)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  relatedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  relatedItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    padding: '0.6rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-main)',
  },
  relatedTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary)',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  relatedMeta: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 44, 64, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    zIndex: 1000,
  },
  previewModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '960px',
    height: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  previewModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-main)',
  },
  modalDownloadBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.45rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.84rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    cursor: 'pointer',
    border: 'none',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  pdfViewerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#525659',
  },
  pdfIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--primary)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  fieldLabel: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  select: {
    width: '100%',
    padding: '0.65rem',
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    width: '100%',
    padding: '0.65rem',
    resize: 'vertical',
  },
  modalActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    padding: '0.6rem 1.1rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmReportBtn: {
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  loadingContainer: {
    minHeight: '60vh',
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
  backBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.7rem 1.4rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'inline-block',
  },
};
