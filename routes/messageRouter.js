const express = require('express');
const { getMessages } = require('../controllers/messageController');
const { isValidUser } = require('../middleWares/auth');

const router = express.Router();

router.get('/:chatId', isValidUser, getMessages);

module.exports = router;