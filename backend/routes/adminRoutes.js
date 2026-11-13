const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

// All admin routes strictly require admin role
router.use(authenticateUser, requireRole('admin'));

// Dashboard & Analytics
router.get('/dashboard', adminController.getAdminStats);
router.get('/analytics', adminController.getAdminAnalytics);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// Resource Management & Moderation
router.get('/resources', adminController.getAllResources);
router.put('/resources/:id/moderation', adminController.updateResourceModeration);
router.delete('/resources/:id', adminController.adminDeleteResource);

// Report Management
router.get('/reports', reportController.getAdminReports);
router.put('/reports/:id', reportController.updateReportStatus);

// Subject Management
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

module.exports = router;
