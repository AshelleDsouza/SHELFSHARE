const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', bookmarkController.getBookmarks);
router.post('/:resourceId', bookmarkController.addBookmark);
router.delete('/:resourceId', bookmarkController.removeBookmark);

module.exports = router;
