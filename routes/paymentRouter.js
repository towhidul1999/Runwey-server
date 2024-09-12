const express = require('express');
const { payment, transaction, incomeDetails, earningChart, yearlyIncomeChart, monthlyIncome, yearlyIncome, weeklyIncome, yearlyIncomeCha, paymentfromStore } = require('../controllers/paymentController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();


router.post('/', isValidUser, payment);
router.post('/store', isValidUser, paymentfromStore);
router.get('/income', isValidUser, incomeDetails);
router.get('/transaction', isValidUser, transaction);
router.get('/earning', earningChart);
router.get('/monthly-income', yearlyIncomeChart);
router.get('/yearly-income', yearlyIncome);
router.get('/weekly-income', weeklyIncome);
router.get('/yearly-income-chart', isValidUser, yearlyIncomeCha);

module.exports = router;