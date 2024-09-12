const express = require('express');
const { createRating, getRatingsByVideoId, deleteRating } = require('../controllers/ratingController');
const { isValidUser } = require('../middleWares/auth');

const router = express.Router();

router.post('/:videoId', isValidUser, createRating);
router.get('/:videoId', isValidUser, getRatingsByVideoId);
router.delete('/:videoId', isValidUser, deleteRating);

module.exports = router;