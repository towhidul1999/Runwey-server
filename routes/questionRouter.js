const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { addQuestion, getQuestion, getQuestions, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const router = express.Router();

/* GET category listing. */
router.post('/', isValidUser, addQuestion);
router.get('/', getQuestions);
router.get('/:id', getQuestion);
router.patch('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;