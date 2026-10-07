import Customer from "../../models/customer/Customer.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import * as mpesaService from "../../services/mpesaService.js";
import * as stripeService from "../../services/stripeService.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const initiateMpesa = asyncHandler(async (req, res) => {
  const { phone, amount, purpose, relatedId } = req.body;

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "mpesa",
    purpose,
    relatedId: relatedId || null,
    amount,
    status: "pending",
    meta: { phone },
  });

  const result = await mpesaService.initiateSTKPush({
    phone,
    amount,
    accountReference: reference,
    description: `DigitalSafaris ${purpose}`,
  });

  if (!result.success) {
    payment.status = "failed";
    payment.failureReason = result.error?.errorMessage || "STK failed";
    await payment.save();
    throw new ApiError(400, result.error?.errorMessage || "Failed to initiate payment");
  }

  payment.meta = { ...payment.meta, checkoutRequestId: result.checkoutRequestId, merchantRequestId: result.merchantRequestId };
  await payment.save();

  res.status(200).json(new ApiResponse(200, { reference, checkoutRequestId: result.checkoutRequestId }, result.customerMessage));
});

const mpesaCallback = asyncHandler(async (req, res) => {
  const parsed = mpesaService.parseCallback(req.body);

  if (!parsed.checkoutRequestId) return res.status(200).json({ success: true });

  if (mpesaService.isDuplicateCallback(parsed.checkoutRequestId)) {
    return res.status(200).json({ success: true });
  }

  const payment = await CustomerPayment.findOne({ "meta.checkoutRequestId": parsed.checkoutRequestId });
  if (!payment) return res.status(200).json({ success: true });

  if (parsed.success) {
    payment.status = "success";
    payment.transactionId = parsed.mpesaReceiptNumber;
    payment.receiptNumber = parsed.mpesaReceiptNumber;
    payment.meta = { ...payment.meta, transactionDate: parsed.transactionDate, phoneNumber: parsed.phoneNumber };
    await payment.save();

    const customer = await Customer.findById(payment.customer);
    if (customer) {
      const { branding, settings } = await getContext();
      await emailService.paymentReceived(customer, {
        payment: { amount: payment.amount, reference: payment.reference, method: "M-Pesa", currency: "KES" },
        branding,
        settings,
      });
      await smsService.paymentReceived(customer, {
        amount: `KES ${payment.amount}`,
        reference: payment.reference,
      });
    }
  } else {
    payment.status = "failed";
    payment.failureReason = parsed.resultDesc || "M-Pesa failed";
    await payment.save();
  }

  res.status(200).json({ success: true });
});

const initiateStripe = asyncHandler(async (req, res) => {
  const { amount, purpose, relatedId, currency } = req.body;

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "stripe",
    purpose,
    relatedId: relatedId || null,
    amount,
    currency: currency || "usd",
    status: "pending",
  });

  const result = await stripeService.createPaymentIntent({
    amount,
    currency: currency || "usd",
    metadata: { reference, customerId: req.customer._id.toString(), purpose },
    customerEmail: req.customer.email,
  });

  if (!result.success) {
    payment.status = "failed";
    payment.failureReason = result.error;
    await payment.save();
    throw new ApiError(400, result.error || "Stripe init failed");
  }

  payment.transactionId = result.id;
  await payment.save();

  res.status(200).json(new ApiResponse(200, { reference, clientSecret: result.clientSecret }, "Payment intent created"));
});

const stripeCallback = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeService.constructWebhookEvent(req.rawBody || req.body, signature);
  } catch (err) {
    logger.error("Stripe webhook signature failed", { error: err.message });
    return res.status(400).json({ received: false });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const reference = intent.metadata?.reference;
    if (reference) {
      const payment = await CustomerPayment.findOne({ reference });
      if (payment && payment.status !== "success") {
        payment.status = "success";
        payment.transactionId = intent.id;
        await payment.save();

        const customer = await Customer.findById(payment.customer);
        if (customer) {
          const { branding, settings } = await getContext();
          await emailService.paymentReceived(customer, {
            payment: { amount: payment.amount, reference: payment.reference, method: "Card", currency: payment.currency.toUpperCase() },
            branding,
            settings,
          });
        }
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const reference = intent.metadata?.reference;
    if (reference) {
      const payment = await CustomerPayment.findOne({ reference });
      if (payment) {
        payment.status = "failed";
        payment.failureReason = intent.last_payment_error?.message || "Card payment failed";
        await payment.save();

        const customer = await Customer.findById(payment.customer);
        if (customer) {
          const { branding, settings } = await getContext();
          await emailService.paymentFailed(customer, {
            payment: { amount: payment.amount, reference: payment.reference, currency: payment.currency.toUpperCase() },
            reason: payment.failureReason,
            branding,
            settings,
          });
        }
      }
    }
  }

  res.status(200).json({ received: true });
});

const payWithWallet = asyncHandler(async (req, res) => {
  const { amount, purpose, relatedId } = req.body;

  const wallet = await (await import("../../models/customer/CustomerWallet.js")).default.findOne({ customer: req.customer._id });
  if (!wallet) throw new ApiError(404, "Wallet not found");
  if (wallet.status === "frozen") throw new ApiError(403, "Wallet frozen");
  if (wallet.balance < amount) throw new ApiError(400, "Insufficient balance");

  wallet.balance -= amount;
  wallet.totalDebited += amount;
  await wallet.save();

  const reference = generateRef("PAY");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "wallet",
    purpose,
    relatedId: relatedId || null,
    amount,
    status: "success",
  });

  const { branding, settings } = await getContext();
  await emailService.paymentReceived(req.customer, {
    payment: { amount, reference, method: "Wallet", currency: "KES" },
    branding,
    settings,
  });

  res.status(200).json(new ApiResponse(200, { reference, balance: wallet.balance }, "Paid with wallet"));
});

const status = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findOne({ reference: req.params.reference, customer: req.customer._id }).lean();
  if (!payment) throw new ApiError(404, "Payment not found");
  res.status(200).json(new ApiResponse(200, payment));
});

export { initiateMpesa, mpesaCallback, initiateStripe, stripeCallback, payWithWallet, status };