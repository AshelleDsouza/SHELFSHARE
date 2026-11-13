const { pool } = require('../config/db');

/**
 * Recalculate average rating and total reviews for a resource
 */
async function updateResourceRatingStats(resourceId) {
  const [statRows] = await pool.execute(
    `SELECT COUNT(*) AS total_reviews, COALESCE(AVG(rating), 0) AS avg_rating
     FROM reviews
     WHERE resource_id = ?`,
    [resourceId]
  );

  const total = statRows[0].total_reviews;
  const avg = parseFloat(Number(statRows[0].avg_rating).toFixed(2));

  await pool.execute(
    'UPDATE resources SET average_rating = ?, total_reviews = ? WHERE id = ?',
    [avg, total, resourceId]
  );
}

/**
 * Submit or update a student review
 * POST /api/resources/:id/reviews
 */
async function createReview(req, res) {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Review comment cannot be empty.' });
    }

    // Verify resource exists and get uploader_id
    const [resRows] = await pool.execute('SELECT id, title, uploader_id FROM resources WHERE id = ?', [
      resourceId,
    ]);
    if (resRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const targetResource = resRows[0];

    // Check if user already reviewed
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );

    if (existing.length > 0) {
      // Update existing review
      await pool.execute(
        'UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?',
        [parsedRating, comment.trim(), existing[0].id]
      );
    } else {
      // Insert new review
      await pool.execute(
        'INSERT INTO reviews (user_id, resource_id, rating, comment) VALUES (?, ?, ?, ?)',
        [userId, resourceId, parsedRating, comment.trim()]
      );

      // Notify resource uploader if not self-review
      if (targetResource.uploader_id !== userId) {
        await pool.execute(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES (?, 'New Review Received', ?, 'new_review', ?)`,
          [
            targetResource.uploader_id,
            `${req.user.full_name} reviewed your resource "${targetResource.title}" with ${parsedRating} stars!`,
            `/resources/${resourceId}`,
          ]
        );
      }
    }

    // Recalculate stats
    await updateResourceRatingStats(resourceId);

    return res.status(200).json({
      success: true,
      message: 'Review saved successfully.',
    });
  } catch (error) {
    console.error('[Create Review Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
}

/**
 * Delete a review (only author or admin)
 * DELETE /api/reviews/:id
 */
async function deleteReview(req, res) {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [rows] = await pool.execute('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const review = rows[0];
    if (!isAdmin && review.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews.' });
    }

    await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // Update resource stats
    await updateResourceRatingStats(review.resource_id);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Review Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
}

module.exports = {
  createReview,
  deleteReview,
  updateResourceRatingStats,
};
