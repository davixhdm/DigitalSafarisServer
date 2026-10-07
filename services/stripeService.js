import stripe from "../config/stripe.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const createPaymentIntent = async ({ amount, currency = env.stripeCurrency, metadata = {}, customerEmail }) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
    });
    return { success: true, clientSecret: intent.client_secret, id: intent.id };
  } catch (err) {
    logger.error("Stripe PaymentIntent error", { error: err.message });
    return { success: false, error: err.message };
  }
};

const retrievePaymentIntent = async (id) => {
  try {
    const intent = await stripe.paymentIntents.retrieve(id);
    return { success: true, intent };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const refundPayment = async ({ paymentIntentId, amount }) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return { success: true, refund };
  } catch (err) {
    logger.error("Stripe refund error", { error: err.message });
    return { success: false, error: err.message };
  }
};

const constructWebhookEvent = (rawBody, signature) =>
  stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

export {
  createPaymentIntent,
  retrievePaymentIntent,
  refundPayment,
  constructWebhookEvent,
};