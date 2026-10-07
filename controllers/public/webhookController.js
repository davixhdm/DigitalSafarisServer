import Payout from "../../models/admin/Payout.js";
import * as mpesaService from "../../services/mpesaService.js";
import logger from "../../utils/logger.js";

const mpesaB2cResult = async (req, res) => {
  try {
    const result = req.body?.Result;
    if (!result) return res.status(200).json({ received: true });

    const conversationId = result.ConversationID;
    const originatorConversationId = result.OriginatorConversationID;
    const resultCode = String(result.ResultCode);

    const payout = await Payout.findOne({
      $or: [
        { "meta.conversationId": conversationId },
        { "meta.originatorConversationId": originatorConversationId },
      ],
    });

    if (payout) {
      if (resultCode === "0") {
        payout.status = "completed";
        payout.transactionId = result.TransactionID || null;
        payout.processedAt = new Date();
      } else {
        payout.status = "failed";
        payout.failureReason = result.ResultDesc || "B2C failed";
      }
      await payout.save();
    }
  } catch (err) {
    logger.error("M-Pesa B2C webhook error", { error: err.message });
  }
  res.status(200).json({ received: true });
};

const mpesaB2cTimeout = async (req, res) => {
  logger.warn("M-Pesa B2C timeout", { body: req.body });
  res.status(200).json({ received: true });
};

const mpesaC2b = async (req, res) => {
  res.status(200).json({ received: true });
};

const mpesaReversal = async (req, res) => {
  logger.warn("M-Pesa reversal", { body: req.body });
  res.status(200).json({ received: true });
};

const stripe = async (req, res) => {
  res.status(200).json({ received: true });
};

const hdmBridge = async (req, res) => {
  res.status(200).json({ received: true });
};

const firebase = async (req, res) => {
  res.status(200).json({ received: true });
};

export { mpesaB2cResult, mpesaB2cTimeout, mpesaC2b, mpesaReversal, stripe, hdmBridge, firebase };