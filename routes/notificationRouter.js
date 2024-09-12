const express = require('express');
const { getNotifications, viewStatusCount } = require('../controllers/notificationController');
const { isValidUser } = require('../middleWares/auth');

const router = express.Router();

router.get('/', isValidUser, getNotifications);
router.get('/view-counts', isValidUser, viewStatusCount);

module.exports = router;