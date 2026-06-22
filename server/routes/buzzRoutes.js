const express = require('express');
const buzzController = require('../controllers/buzzController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', buzzController.getPosts);
router.post('/', buzzController.createPost);
router.post('/:id/like', buzzController.toggleLike);

module.exports = router;
