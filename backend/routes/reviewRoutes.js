const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/:id/reviews', authenticateUser, reviewController.createReview);
router.delete('/:id', authenticateUser, reviewController.deleteReview);

module.exports = router;
