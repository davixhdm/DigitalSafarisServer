const Wallet = require('../../models/customer/Wallet');
const Payment = require('../../models/customer/Payment');
const PlatformSettings = require('../../models/admin/PlatformSettings');
const { stripe: stripeService, mpesa: mpesaService } = require('../../services/paymentService');
const { customer: customerEmails } = require('../../services/emailService');
const { createNotification } = require('../../services/notificationService');
const logger = require('../../utils/logger');

const getPlatformCurrency = async () => {
    const setting = await PlatformSettings.findOne({ key: 'default_currency' });
    return setting?.value || 'KES';
};

const findOrCreateWallet = async (customerId, currency = 'KES') => {
    return await Wallet.findOneAndUpdate(
        { customer: String(customerId) },
        { $setOnInsert: { balance: 0, currency } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

const getWallet = async (req, res, next) => {
    try {
        const customerId = String(req.user._id);
        const currency = await getPlatformCurrency();
        const wallet = await findOrCreateWallet(customerId, currency);
        res.json({ success: true, wallet });
    } catch (error) { next(error); }
};

const topUp = async (req, res, next) => {
    try {
        const { amount, method } = req.body;
        const customerId = String(req.user._id);
        const currency = await getPlatformCurrency();

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount required.' });
        }

        let paymentResult;

        if (method === 'stripe') {
            const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
                amount,
                currency,
                metadata: { customerId, type: 'wallet_topup' },
            });
            paymentResult = { clientSecret, paymentIntentId };
        } else if (method === 'mpesa') {
            const phone = req.body.phone || req.user.phone;
            if (!phone) return res.status(400).json({ success: false, message: 'Phone required for M-Pesa.' });
            const reference = 'TOPUP-' + Date.now();
            const { checkoutRequestId } = await mpesaService.stkPush({
                phone,
                amount,
                reference,
                description: 'Wallet Top-up',
            });
            paymentResult = { checkoutRequestId, reference };
        } else if (method === 'wallet') {
            return res.status(400).json({ success: false, message: 'Cannot top up wallet with wallet.' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment method.' });
        }

        await Payment.create({
            customer: customerId,
            amount,
            currency,
            method,
            type: 'topup',
            status: 'pending',
            transactionId: paymentResult.paymentIntentId || paymentResult.checkoutRequestId,
            reference: paymentResult.reference || paymentResult.paymentIntentId,
            metadata: { ...paymentResult, topup: true },
        });

        res.json({
            success: true,
            payment: paymentResult,
            message: 'Top-up of ' + currency + ' ' + amount + ' initiated via ' + method,
        });
    } catch (error) { next(error); }
};

const confirmTopUp = async (req, res, next) => {
    try {
        const { paymentIntentId, checkoutRequestId } = req.body;
        const customerId = String(req.user._id);
        const currency = await getPlatformCurrency();
        const query = { customer: customerId, status: 'pending' };
        if (paymentIntentId) query.transactionId = paymentIntentId;
        if (checkoutRequestId) query.transactionId = checkoutRequestId;

        const existing = await Payment.findOne(query);
        if (!existing) return res.status(404).json({ success: false, message: 'Payment not found.' });

        const updated = await Payment.findOneAndUpdate(
            { _id: existing._id, status: 'pending' },
            { status: 'completed' },
            { new: true }
        );
        if (!updated) {
            return res.json({ success: true, message: 'Top-up already confirmed.' });
        }

        const wallet = await findOrCreateWallet(customerId, currency);
        wallet.balance += updated.amount;
        wallet.transactions.push({
            type: 'credit',
            amount: updated.amount,
            description: 'Top-up via ' + updated.method,
            reference: updated.reference,
            createdAt: new Date(),
        });
        await wallet.save();

        customerEmails.sendWalletTopup(req.user, updated.amount, wallet.balance).catch(function(e) {
            logger.error('Topup email failed: ' + e.message);
        });

        createNotification({
            customerId,
            type: 'payment',
            title: 'Wallet Topped Up',
            message: 'KES ' + updated.amount.toLocaleString() + ' added to your wallet.',
        }).catch(function(e) {
            logger.error('Notification failed: ' + e.message);
        });

        res.json({ success: true, wallet, message: 'Top-up confirmed.' });
    } catch (error) { next(error); }
};

const addPaymentMethod = async (req, res, next) => {
    try {
        const customerId = String(req.user._id);
        const currency = await getPlatformCurrency();
        const wallet = await findOrCreateWallet(customerId, currency);
        wallet.savedMethods.push(req.body);
        await wallet.save();
        res.json({ success: true, methods: wallet.savedMethods });
    } catch (error) { next(error); }
};

const updatePaymentMethod = async (req, res, next) => {
    try {
        const customerId = String(req.user._id);
        const wallet = await Wallet.findOne({ customer: customerId });
        if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found.' });
        const method = wallet.savedMethods.id(req.params.id);
        if (!method) return res.status(404).json({ success: false, message: 'Method not found.' });
        Object.assign(method, req.body);
        await wallet.save();
        res.json({ success: true, methods: wallet.savedMethods });
    } catch (error) { next(error); }
};

const removePaymentMethod = async (req, res, next) => {
    try {
        const customerId = String(req.user._id);
        const wallet = await Wallet.findOne({ customer: customerId });
        if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found.' });
        wallet.savedMethods.pull({ _id: req.params.id });
        await wallet.save();
        res.json({ success: true, methods: wallet.savedMethods });
    } catch (error) { next(error); }
};

module.exports = { getWallet, topUp, confirmTopUp, addPaymentMethod, updatePaymentMethod, removePaymentMethod };