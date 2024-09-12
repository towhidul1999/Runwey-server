const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { questionAnswer, getQuestionAnswer, getQuestionAnswerById, singleContentCreator } = require('../controllers/answerController');
const router = express.Router();

/* GET category listing. */
router.post('/question-answer', isValidUser, questionAnswer);
router.get('/question-answer', isValidUser, getQuestionAnswer);
router.get('/:userId', isValidUser, getQuestionAnswerById);
router.get('/content-creator/:id', isValidUser, singleContentCreator);

module.exports = router;