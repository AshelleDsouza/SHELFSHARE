const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', collectionController.getCollections);
router.post('/', collectionController.createCollection);
router.get('/:id', collectionController.getCollectionById);
router.put('/:id', collectionController.updateCollection);
router.delete('/:id', collectionController.deleteCollection);

router.post('/:id/resources/:resourceId', collectionController.addResourceToCollection);
router.delete('/:id/resources/:resourceId', collectionController.removeResourceFromCollection);

module.exports = router;
