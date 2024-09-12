const express = require('express');
const { getMySubscription } = require('../controllers/mySubscriptionController');
const { isValidUser } = require('../middleWares/auth');

const router = express.Router();

router.get('/', isValidUser, getMySubscription);

module.exports = router;