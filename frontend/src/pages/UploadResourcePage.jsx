import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  Calendar,
  BookOpen,
  Tag,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import api from '../services/api';

const RESOURCE_TYPES = [
  'Lecture Notes',
  'Handwritten Notes',
  'Previous Year Question Papers',
  'Assignments',
  'Presentations',
  'Programming Examples',
  'Reference Materials',
  'Other',
];

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadResourcePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: user?.course_id || '',
    semester_id: user?.semester_id || '',
    subject_id: '',
    unit_name: '',
    resource_type: 'Lecture Notes',
    tags: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial courses
  useEffect(() => {
    api
      .get('/academic/courses')
      .then((res) => {
        if (res.data?.courses) setCourses(res.data.courses);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch semesters when course changes
  useEffect(() => {
    if (formData.course_id) {
      api
        .get(`/academic/courses/${formData.course_id}/semesters`)
        .then((res) => {
          if (res.data?.semesters) {
            setSemesters(res.data.semesters);
          }
        })
        .catch((err) => console.error(err));
    } else {
      setSemesters([]);
      setFormData((prev) => ({ ...prev, semester_id: '', subject_id: '' }));
    }
  }, [formData.course_id]);

  // Fetch subjects when course or semester changes
  useEffect(() => {
    if (formData.course_id && formData.semester_id) {
      api
        .get(`/academic/subjects?course_id=${formData.course_id}&semester_id=${formData.semester_id}`)
        .then((res) => {
          if (res.data?.subjects) {
            setSubjects(res.data.subjects);
          }
        })
        .catch((err) => console.error(err));
    } else {
      setSubjects([]);
      setFormData((prev) => ({ ...prev, subject_id: '' }));
    }
  }, [formData.course_id, formData.semester_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(fileExt)) {
      setError(`Invalid file type (${fileExt}). Allowed formats: PDF, DOC, DOCX, PPT, PPTX.`);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 10 MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select or drop a valid document file to upload.');
      return;
    }

    if (!formData.title || !formData.description || !formData.course_id || !formData.semester_id || !formData.subject_id) {
      setError('Please fill in all required academic metadata fields.');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('course_id', formData.course_id);
      data.append('semester_id', formData.semester_id);
      data.append('subject_id', formData.subject_id);
      data.append('unit_name', formData.unit_name);
      data.append('resource_type', formData.resource_type);
      data.append('tags', formData.tags);
      data.append('academic_year', formData.academic_year);
      data.append('file', file);

      const res = await api.post('/resources', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        showToast('Resource uploaded successfully!', 'success');
        navigate('/my-uploads');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badge}>
            <Upload size={14} color="var(--primary)" />
            <span>Academic Resource Upload</span>
          </div>
          <h1 style={styles.title}>Share Study Material</h1>
          <p style={styles.subtitle}>
            Upload lecture notes, handwritten summaries, lab manuals, and previous year exam questions.
          </p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} color="var(--error)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formCard}>
          {/* 1. DOCUMENT DROPZONE */}
          <div style={styles.sectionBlock}>
            <label style={styles.sectionLabel}>
              1. Document File <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div
              style={{
                ...styles.dropzone,
                borderColor: isDragging ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: isDragging ? 'var(--secondary-light)' : '#FFFFFF',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {file ? (
                <div style={styles.selectedFileBox}>
                  <div style={styles.fileIconBox}>
                    <FileText size={28} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.fileName}>{file.name}</p>
                    <p style={styles.fileMeta}>
                      {(file.size / 1024).toFixed(1)} KB &bull;{' '}
                      {file.name.split('.').pop().toUpperCase()} Document
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    style={styles.removeFileBtn}
                    title="Remove file"
                  >
                    <X size={18} color="var(--error)" />
                  </button>
                </div>
              ) : (
                <div style={styles.dropzonePrompt}>
                  <div style={styles.uploadIconCircle}>
                    <Upload size={24} color="var(--primary)" />
                  </div>
                  <p style={styles.dropzoneMainText}>
                    <strong>Click to upload</strong> or drag and drop your document here
                  </p>
                  <p style={styles.dropzoneSubText}>
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX (Maximum size: 10 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. RESOURCE CORE DETAILS */}
          <div style={styles.sectionBlock}>
            <label style={styles.sectionLabel}>
              2. Title & Description <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Resource Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Unit 3: Binary Search Trees & AVL Rotations"
                value={formData.title}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Detailed Description</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Provide a clear description of the content, key formulas, covered topics, or solved question numbers..."
                value={formData.description}
                onChange={handleChange}
                style={styles.textarea}
                required
              />
            </div>
          </div>

          {/* 3. ACADEMIC MAPPING (Course, Semester, Subject) */}
          <div style={styles.sectionBlock}>
            <label style={styles.sectionLabel}>
              3. Academic Curriculum Mapping <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={styles.gridRow}>
              {/* Course */}
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Course / Program</label>
                <div style={styles.inputWrapper}>
                  <GraduationCap size={16} color="var(--text-secondary)" style={styles.iconPrefix} />
                  <select
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Semester */}
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Semester</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={16} color="var(--text-secondary)" style={styles.iconPrefix} />
                  <select
                    name="semester_id"
                    value={formData.semester_id}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={!formData.course_id}
                    required
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.semester_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Subject / Course Module</label>
                <div style={styles.inputWrapper}>
                  <BookOpen size={16} color="var(--text-secondary)" style={styles.iconPrefix} />
                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={!formData.semester_id}
                    required
                  >
                    <option value="">
                      {!formData.semester_id ? 'Choose Semester First' : 'Select Subject'}
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subject_code} - {sub.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 4. RESOURCE TYPE, UNIT & TAGS */}
          <div style={styles.sectionBlock}>
            <label style={styles.sectionLabel}>4. Classification & Tagging</label>
            <div style={styles.gridRow}>
              {/* Resource Type */}
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Resource Type</label>
                <div style={styles.inputWrapper}>
                  <Layers size={16} color="var(--text-secondary)" style={styles.iconPrefix} />
                  <select
                    name="resource_type"
                    value={formData.resource_type}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit / Topic */}
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Unit or Topic (Optional)</label>
                <input
                  type="text"
                  name="unit_name"
                  placeholder="e.g. Unit 3: Graph Traversal"
                  value={formData.unit_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              {/* Academic Year */}
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Academic Year</label>
                <input
                  type="text"
                  name="academic_year"
                  placeholder="e.g. 2025-2026"
                  value={formData.academic_year}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Tags */}
            <div style={{ ...styles.inputGroup, marginTop: '1rem' }}>
              <label style={styles.fieldLabel}>
                Tags (Comma-separated for search discovery)
              </label>
              <div style={styles.inputWrapper}>
                <Tag size={16} color="var(--text-secondary)" style={styles.iconPrefix} />
                <input
                  type="text"
                  name="tags"
                  placeholder="e.g. dsa, avl-trees, recursion, exam-notes, sem1"
                  value={formData.tags}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Submit Button Row */}
          <div style={styles.actionRow}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{
                ...styles.submitBtn,
                opacity: uploading ? 0.7 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? (
                <>
                  <Upload size={18} className="spin" />
                  <span>Uploading Document...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Publish Academic Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
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
    maxWidth: '860px',
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
    letterSpacing: '-0.4px',
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  errorAlert: {
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error)',
    padding: '0.9rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    border: '1px solid #FFCDD2',
    fontSize: '0.9rem',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  sectionLabel: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
  },
  dropzone: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.2rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  dropzonePrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
  },
  uploadIconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: 'var(--secondary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneMainText: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  dropzoneSubText: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  selectedFileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: 'var(--bg-main)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
  },
  fileIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  fileName: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  fileMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  removeFileBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.4rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
  },
  fieldLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  iconPrefix: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem',
  },
  select: {
    width: '100%',
    padding: '0.7rem 0.9rem 0.7rem 2.4rem',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    resize: 'vertical',
    lineHeight: 1.5,
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    padding: '0.8rem 1.4rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.92rem',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    padding: '0.85rem 1.8rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 2px 8px rgba(23, 44, 64, 0.2)',
  },
};
