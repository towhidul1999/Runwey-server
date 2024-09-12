const express = require('express');
const { getChat,addChat } = require('../controllers/chatController');
const { isValidUser } = require('../middleWares/auth');

const router = express.Router();

router.get('/', isValidUser, getChat);

module.exports = router;