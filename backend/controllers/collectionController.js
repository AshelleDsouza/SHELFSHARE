const { pool } = require('../config/db');

/**
 * Get all collections belonging to the logged-in student
 * GET /api/collections
 */
async function getCollections(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT c.id, c.collection_name, c.description, c.created_at, c.updated_at,
              COUNT(cr.resource_id) AS total_resources
       FROM collections c
       LEFT JOIN collection_resources cr ON c.id = cr.collection_id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      collections: rows,
    });
  } catch (error) {
    console.error('[Get Collections Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve study collections.' });
  }
}

/**
 * Get single collection with its resources
 * GET /api/collections/:id
 */
async function getCollectionById(req, res) {
  try {
    const collectionId = req.params.id;
    const userId = req.user.id;

    const [colRows] = await pool.execute(
      'SELECT * FROM collections WHERE id = ? AND user_id = ?',
      [collectionId, userId]
    );

    if (colRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Collection not found or access denied.' });
    }

    const collection = colRows[0];

    // Fetch resources in this collection
    const [resources] = await pool.execute(
      `SELECT r.id, r.title, r.description, r.resource_type, r.file_type, r.file_size,
              r.average_rating, r.download_count, r.created_at,
              c.course_code, s.semester_number, sub.subject_name,
              u.full_name AS uploader_name, cr.added_at
       FROM collection_resources cr
       JOIN resources r ON cr.resource_id = r.id
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN users u ON r.uploader_id = u.id
       WHERE cr.collection_id = ? AND r.moderation_status = 'approved'
       ORDER BY cr.added_at DESC`,
      [collectionId]
    );

    return res.status(200).json({
      success: true,
      collection,
      resources,
    });
  } catch (error) {
    console.error('[Get Collection By ID Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve collection details.' });
  }
}

/**
 * Create a new study collection
 * POST /api/collections
 */
async function createCollection(req, res) {
  try {
    const userId = req.user.id;
    const { collection_name, description } = req.body;

    if (!collection_name || !collection_name.trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO collections (user_id, collection_name, description) VALUES (?, ?, ?)',
      [userId, collection_name.trim(), description ? description.trim() : null]
    );

    const [newCol] = await pool.execute('SELECT * FROM collections WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Study collection created successfully!',
      collection: newCol[0],
      data: newCol[0],
    });
  } catch (error) {
    console.error('[Create Collection Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to create collection.' });
  }
}

/**
 * Update collection details
 * PUT /api/collections/:id
 */
async function updateCollection(req, res) {
  try {
    const collectionId = req.params.id;
    const userId = req.user.id;
    const { collection_name, description } = req.body;

    if (!collection_name || !collection_name.trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required.' });
    }

    const [check] = await pool.execute('SELECT id FROM collections WHERE id = ? AND user_id = ?', [
      collectionId,
      userId,
    ]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Collection not found or access denied.' });
    }

    await pool.execute(
      'UPDATE collections SET collection_name = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [collection_name.trim(), description ? description.trim() : null, collectionId]
    );

    return res.status(200).json({
      success: true,
      message: 'Collection updated successfully.',
    });
  } catch (error) {
    console.error('[Update Collection Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to update collection.' });
  }
}

/**
 * Delete a collection
 * DELETE /api/collections/:id
 */
async function deleteCollection(req, res) {
  try {
    const collectionId = req.params.id;
    const userId = req.user.id;

    const [check] = await pool.execute('SELECT id FROM collections WHERE id = ? AND user_id = ?', [
      collectionId,
      userId,
    ]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Collection not found or access denied.' });
    }

    await pool.execute('DELETE FROM collections WHERE id = ?', [collectionId]);

    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Collection Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to delete collection.' });
  }
}

/**
 * Add resource to a collection
 * POST /api/collections/:id/resources/:resourceId
 */
async function addResourceToCollection(req, res) {
  try {
    const { id: collectionId, resourceId } = req.params;
    const userId = req.user.id;

    // Verify user owns collection
    const [col] = await pool.execute('SELECT id FROM collections WHERE id = ? AND user_id = ?', [
      collectionId,
      userId,
    ]);
    if (col.length === 0) {
      return res.status(404).json({ success: false, message: 'Collection not found or access denied.' });
    }

    // Insert into collection_resources
    await pool.execute(
      'INSERT INTO collection_resources (collection_id, resource_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE added_at = CURRENT_TIMESTAMP',
      [collectionId, resourceId]
    );

    return res.status(200).json({
      success: true,
      message: 'Resource added to study collection.',
    });
  } catch (error) {
    console.error('[Add Resource to Collection Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to add resource to collection.' });
  }
}

/**
 * Remove resource from a collection
 * DELETE /api/collections/:id/resources/:resourceId
 */
async function removeResourceFromCollection(req, res) {
  try {
    const { id: collectionId, resourceId } = req.params;
    const userId = req.user.id;

    const [col] = await pool.execute('SELECT id FROM collections WHERE id = ? AND user_id = ?', [
      collectionId,
      userId,
    ]);
    if (col.length === 0) {
      return res.status(404).json({ success: false, message: 'Collection not found or access denied.' });
    }

    await pool.execute(
      'DELETE FROM collection_resources WHERE collection_id = ? AND resource_id = ?',
      [collectionId, resourceId]
    );

    return res.status(200).json({
      success: true,
      message: 'Resource removed from study collection.',
    });
  } catch (error) {
    console.error('[Remove Resource from Collection Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to remove resource from collection.' });
  }
}

module.exports = {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addResourceToCollection,
  removeResourceFromCollection,
};
