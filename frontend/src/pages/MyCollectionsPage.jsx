import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  Plus,
  Folder,
  FolderOpen,
  FileText,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  Download,
  Star,
  ArrowLeft,
  Calendar,
  Compass,
} from 'lucide-react';
import ResourceCard from '../components/resources/ResourceCard';
import api from '../services/api';

export default function MyCollectionsPage() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionResources, setCollectionResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);

  // Create Collection Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Collection Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editColName, setEditColName] = useState('');
  const [editColDesc, setEditColDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Collection Confirm
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/collections');
      if (res.data?.success) {
        setCollections(res.data.collections || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load collections.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const openCollection = async (col) => {
    try {
      setSelectedCollection(col);
      setLoadingResources(true);
      const res = await api.get(`/collections/${col.id}`);
      if (res.data?.success) {
        setCollectionResources(res.data.resources || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load collection documents.', 'error');
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) {
      showToast('Please provide a collection name.', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/collections', {
        collection_name: newColName,
        description: newColDesc,
      });

      if (res.data?.success) {
        showToast('Study collection created!', 'success');
        setCreateModalOpen(false);
        setNewColName('');
        setNewColDesc('');
        fetchCollections();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create collection.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = () => {
    setEditColName(selectedCollection.collection_name);
    setEditColDesc(selectedCollection.description || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editColName.trim()) return;

    try {
      setSavingEdit(true);
      const res = await api.put(`/collections/${selectedCollection.id}`, {
        collection_name: editColName,
        description: editColDesc,
      });

      if (res.data?.success) {
        showToast('Collection updated!', 'success');
        setSelectedCollection((prev) => ({
          ...prev,
          collection_name: editColName,
          description: editColDesc,
        }));
        setEditModalOpen(false);
        fetchCollections();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update collection.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      setDeleting(true);
      const res = await api.delete(`/collections/${selectedCollection.id}`);
      if (res.data?.success) {
        showToast('Collection deleted.', 'info');
        setDeleteModalOpen(false);
        setSelectedCollection(null);
        fetchCollections();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete collection.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveFromCollection = async (resourceId) => {
    try {
      const res = await api.delete(`/collections/${selectedCollection.id}/resources/${resourceId}`);
      if (res.data?.success) {
        showToast('Resource removed from this collection.', 'info');
        setCollectionResources((prev) => prev.filter((r) => r.id !== resourceId));
        // decrement count in collection list
        setCollections((prev) =>
          prev.map((c) =>
            c.id === selectedCollection.id
              ? { ...c, total_resources: Math.max(0, c.total_resources - 1) }
              : c
          )
        );
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove resource.', 'error');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back Link if inside a collection */}
        {selectedCollection ? (
          <div>
            <button onClick={() => setSelectedCollection(null)} style={styles.backBtn}>
              <ArrowLeft size={16} />
              <span>Back to All Collections</span>
            </button>

            {/* Collection Detail Header */}
            <div style={styles.colHeaderCard}>
              <div style={styles.colHeaderTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={styles.folderIconBadge}>
                    <FolderOpen size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <h1 style={styles.title}>{selectedCollection.collection_name}</h1>
                    <p style={styles.subtitle}>
                      {selectedCollection.description || 'Personal student study collection.'}
                    </p>
                  </div>
                </div>

                <div style={styles.actionBtnRow}>
                  <button onClick={handleOpenEdit} style={styles.actionBtn}>
                    <Edit2 size={15} />
                    <span>Edit Info</span>
                  </button>
                  <button onClick={() => setDeleteModalOpen(true)} style={styles.deleteActionBtn}>
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div style={styles.colMetaRow}>
                <span style={styles.colMetaItem}>
                  <strong>{collectionResources.length}</strong> items in collection
                </span>
                <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                <span style={styles.colMetaItem}>
                  Created {new Date(selectedCollection.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Resources inside this collection */}
            {loadingResources ? (
              <div style={styles.emptyCard}>Loading collection items...</div>
            ) : collectionResources.length === 0 ? (
              <div style={styles.emptyCard}>
                <Folder size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>Collection is empty</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.5rem' }}>
                  You haven't added any notes to this collection yet. Browse the catalog to curate study sets.
                </p>
                <Link to="/explore" style={styles.createBtn}>
                  <Compass size={16} />
                  <span>Discover Study Materials</span>
                </Link>
              </div>
            ) : (
              <div style={styles.grid}>
                {collectionResources.map((res) => (
                  <div key={res.id} style={{ position: 'relative' }}>
                    <ResourceCard resource={res} />
                    <button
                      onClick={() => handleRemoveFromCollection(res.id)}
                      style={styles.removeFromColBtn}
                      title="Remove from this collection"
                    >
                      <Trash2 size={14} color="var(--error)" />
                      <span>Remove from set</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Main Collections Overview */}
            <div style={styles.header}>
              <div>
                <div style={styles.badge}>
                  <Layers size={14} color="var(--primary)" />
                  <span>Curated Digital Bookshelves</span>
                </div>
                <h1 style={styles.title}>Study Collections</h1>
                <p style={styles.subtitle}>
                  Organize lecture notes, lab manuals, and exam papers into focused topical bundles.
                </p>
              </div>
              <button onClick={() => setCreateModalOpen(true)} style={styles.createBtn}>
                <Plus size={18} />
                <span>Create Collection</span>
              </button>
            </div>

            {/* Collections Grid */}
            {loading ? (
              <div style={styles.emptyCard}>Loading your study collections...</div>
            ) : collections.length === 0 ? (
              <div style={styles.emptyCard}>
                <Layers size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>
                  No study collections yet
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', marginBottom: '1.5rem' }}>
                  Create themed study bundles like "MCA Sem 2 Finals", "DSA Practical Set", or "OS Revision" to organize your learning materials.
                </p>
                <button onClick={() => setCreateModalOpen(true)} style={styles.createBtn}>
                  <Plus size={16} />
                  <span>Create First Collection</span>
                </button>
              </div>
            ) : (
              <div style={styles.collectionsGrid}>
                {collections.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => openCollection(col)}
                    style={styles.collectionCard}
                  >
                    <div style={styles.colCardTop}>
                      <div style={styles.colFolderIcon}>
                        <Folder size={22} color="var(--primary)" />
                      </div>
                      <span style={styles.itemCountBadge}>
                        {col.total_resources} resource{col.total_resources !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <h3 style={styles.colName}>{col.collection_name}</h3>
                    <p style={styles.colDesc}>
                      {col.description || 'Custom curated study collection.'}
                    </p>

                    <div style={styles.colCardFooter}>
                      <span style={styles.colUpdatedDate}>
                        Updated {new Date(col.updated_at || col.created_at).toLocaleDateString()}
                      </span>
                      <span style={styles.openColText}>Open Set &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE COLLECTION MODAL */}
        {createModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Create Study Collection</h3>
                <button onClick={() => setCreateModalOpen(false)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} style={styles.modalForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Collection Name</label>
                  <input
                    type="text"
                    placeholder="e.g. MCA Semester 2 Exam Revision"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Description (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Describe the purpose of this collection..."
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ ...styles.submitBtn, opacity: creating ? 0.7 : 1 }}
                  >
                    {creating ? 'Creating...' : 'Create Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT COLLECTION MODAL */}
        {editModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Edit Collection</h3>
                <button onClick={() => setEditModalOpen(false)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={styles.modalForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Collection Name</label>
                  <input
                    type="text"
                    value={editColName}
                    onChange={(e) => setEditColName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Description</label>
                  <textarea
                    rows="3"
                    value={editColDesc}
                    onChange={(e) => setEditColDesc(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    style={{ ...styles.submitBtn, opacity: savingEdit ? 0.7 : 1 }}
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '440px' }}>
              <h3 style={styles.modalTitle}>Delete Collection?</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>
                Are you sure you want to delete <strong>{selectedCollection.collection_name}</strong>?
                The resources inside will remain safe in the library catalog.
              </p>

              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  style={styles.cancelBtn}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCollection}
                  disabled={deleting}
                  style={styles.confirmDeleteBtn}
                >
                  {deleting ? 'Deleting...' : 'Delete Collection'}
                </button>
              </div>
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
    padding: '2.5rem 1.5rem 5rem',
    minHeight: 'calc(100vh - 140px)',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '1.25rem',
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
  createBtn: {
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
    border: 'none',
    cursor: 'pointer',
  },
  collectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
  },
  colCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  colFolderIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'var(--secondary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCountBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
  },
  colName: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--primary)',
    marginBottom: '0.4rem',
  },
  colDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '1.5rem',
  },
  colCardFooter: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-color)',
  },
  colUpdatedDate: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  openColText: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--primary)',
  },
  colHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: 'var(--shadow-sm)',
  },
  colHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
  },
  folderIconBadge: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: 'var(--secondary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    padding: '0.5rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.84rem',
    fontWeight: 600,
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  deleteActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--error-bg)',
    border: '1px solid #FFCDD2',
    color: 'var(--error)',
    padding: '0.5rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.84rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  colMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
  },
  colMetaItem: {
    display: 'inline',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  removeFromColBtn: {
    marginTop: '0.5rem',
    width: '100%',
    padding: '0.4rem',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--error)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    cursor: 'pointer',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 44, 64, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '520px',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
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
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem',
  },
  textarea: {
    width: '100%',
    padding: '0.7rem 0.9rem',
    resize: 'vertical',
  },
  modalActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.75rem',
  },
  cancelBtn: {
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    padding: '0.65rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    border: 'none',
    padding: '0.65rem 1.35rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    backgroundColor: 'var(--error)',
    color: '#FFFFFF',
    border: 'none',
    padding: '0.65rem 1.35rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
