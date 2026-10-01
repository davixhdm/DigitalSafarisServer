const router = require('express').Router();
const { getPaymentMethods, processPayment, verifyPayment, getPaymentHistory, getPayment, mpesaCallback } = require('../../controllers/customer/paymentController');
const customerAuth = require('../../middleware/customer/customerAuth');

router.get('/methods', getPaymentMethods);
router.post('/mpesa/callback', mpesaCallback);

router.use(customerAuth);
router.post('/process', processPayment);
router.post('/verify', verifyPayment);
router.get('/', getPaymentHistory);
router.get('/:id', getPayment);

module.exports = router;