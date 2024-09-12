const express = require('express');
const { addSubscribe, getSubscription, getSubscriptions, updateSubscription, deleteSubscription, subscribe, subscriptionDisable } = require('../controllers/subscribeController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

/* GET category listing. */
router.post('/', isValidUser, addSubscribe);
router.get('/', getSubscriptions);
router.get('/:id', getSubscription);
router.patch('/:id', isValidUser, updateSubscription);
router.delete('/:id', deleteSubscription);
router.post('/added/:subcriptionId', isValidUser, subscribe);
router.post('/disable/:subcriptionId', isValidUser, subscriptionDisable);


module.exports = router;