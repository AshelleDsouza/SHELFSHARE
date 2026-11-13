const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/history', authenticateUser, fileController.getDownloadHistory);

module.exports = router;
