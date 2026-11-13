const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');

router.get('/courses', academicController.getCourses);
router.get('/courses/:courseId/semesters', academicController.getSemestersByCourse);
router.get('/subjects', academicController.getSubjects);

module.exports = router;
