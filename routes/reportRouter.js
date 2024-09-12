const express = require('express');
const router = express.Router();
const report = require('../controllers/reportController');
const { isValidUser } = require('../middleWares/auth');

router.post('/:id', isValidUser, report);

module.exports = router;