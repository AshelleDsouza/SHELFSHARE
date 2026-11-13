const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

// Student submits report
router.post('/', authenticateUser, reportController.createReport);

// Admin reports management
router.get('/admin', authenticateUser, requireRole('admin'), reportController.getAdminReports);
router.put('/admin/:id', authenticateUser, requireRole('admin'), reportController.updateReportStatus);

module.exports = router;
