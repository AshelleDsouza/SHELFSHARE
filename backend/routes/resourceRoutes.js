const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const fileController = require('../controllers/fileController');
const reviewController = require('../controllers/reviewController');
const recommendationController = require('../controllers/recommendationController');
const { authenticateUser, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createResourceValidator,
  updateResourceValidator,
} = require('../validators/resourceValidators');

// Public / Guest Accessible Resource Discovery
router.get('/', optionalAuth, resourceController.getResources);
router.get('/popular', recommendationController.getPopularResources);
router.get('/recommended', authenticateUser, recommendationController.getRecommendedResources);
router.get('/my-uploads', authenticateUser, resourceController.getMyUploads);
router.get('/:id', optionalAuth, resourceController.getResourceById);

// PDF Preview (Inline stream)
router.get('/:id/preview', optionalAuth, fileController.previewResource);

// Authenticated File Download (Tracks download in MySQL)
router.get('/:id/download', authenticateUser, fileController.downloadResource);

// Reviews on resources
router.post('/:id/reviews', authenticateUser, reviewController.createReview);

// Protected upload & management endpoints
router.post(
  '/',
  authenticateUser,
  upload.single('file'),
  createResourceValidator,
  resourceController.createResource
);

router.put('/:id', authenticateUser, updateResourceValidator, resourceController.updateResource);
router.delete('/:id', authenticateUser, resourceController.deleteResource);

module.exports = router;
