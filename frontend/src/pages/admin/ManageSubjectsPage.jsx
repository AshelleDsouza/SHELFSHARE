import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Plus, Edit2, Trash2, Search, X, Check, Filter } from 'lucide-react';

export default function ManageSubjectsPage() {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course_id: '',
    semester_id: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [subjRes, courseRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/academic/courses')
      ]);
      setSubjects(subjRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (cId) => {
    setFormData(prev => ({ ...prev, course_id: cId, semester_id: '' }));
    if (!cId) {
      setSemesters([]);
      return;
    }
    try {
      const res = await api.get(`/academic/courses/${cId}/semesters`);
      setSemesters(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      course_id: courses[0]?.id || '',
      semester_id: '',
      description: ''
    });
    if (courses[0]?.id) {
      handleCourseChange(courses[0].id);
    }
    setModalOpen(true);
  };

  const openEditModal = async (s) => {
    setEditingSubject(s);
    setFormData({
      name: s.name,
      code: s.code,
      course_id: s.course_id,
      semester_id: s.semester_id,
      description: s.description || ''
    });
    try {
      const res = await api.get(`/academic/courses/${s.course_id}/semesters`);
      setSemesters(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.course_id || !formData.semester_id) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject.id}`, formData);
        showToast('Subject updated successfully', 'success');
      } else {
        await api.post('/admin/subjects', formData);
        showToast('Subject added successfully', 'success');
      }
      setModalOpen(false);
      fetchInitialData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? If there are associated resources, it cannot be deleted.`)) {
      return;
    }
    try {
      await api.delete(`/admin/subjects/${id}`);
      showToast('Subject deleted successfully', 'success');
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete subject', 'error');
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.code.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = courseFilter ? s.course_id === parseInt(courseFilter) : true;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Manage Subjects</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Configure academic subjects, syllabus codes and semester associations</p>
        </div>
        <button 
          onClick={openAddModal}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'var(--color-primary)', 
            color: '#fff', 
            padding: '0.75rem 1.25rem', 
            borderRadius: 'var(--radius-md)', 
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={18} /> Add New Subject
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem', 
        background: '#fff', 
        padding: '1rem', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search subjects by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.65rem 1rem 0.65rem 2.5rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #E2E8F0',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <select 
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.65rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #E2E8F0',
              outline: 'none'
            }}
          >
            <option value="">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} ({c.name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>Loading subjects...</div>
      ) : filteredSubjects.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>No Subjects Found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your filters or click "Add New Subject".</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Code</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Subject Name</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Course</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Semester</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Resources</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      <span style={{ background: 'var(--color-accent)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {sub.code}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{sub.name}</div>
                      {sub.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sub.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      {sub.course_name || sub.course_code}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      Semester {sub.semester_number}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)', background: '#EDF2F7', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                        {sub.resource_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => openEditModal(sub)}
                          style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: '#F1F5F9', color: 'var(--color-primary)' }}
                          title="Edit Subject"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(sub.id, sub.name)}
                          style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: '#DC2626' }}
                          title="Delete Subject"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 'var(--radius-lg)', 
            width: '100%', 
            maxWidth: '520px', 
            padding: '2rem', 
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
                  Subject Name *
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Distributed Database Systems"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
                  Subject Code *
                </label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. MCA401"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
                    Course *
                  </label>
                  <select 
                    value={formData.course_id}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
                    Semester *
                  </label>
                  <select 
                    value={formData.semester_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, semester_id: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>Semester {s.semester_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
                  Description (Optional)
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief curriculum overview or focus areas..."
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', background: '#F1F5F9', color: 'var(--color-text-secondary)', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
                >
                  {submitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
