import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import * as mpesaService from "../../services/mpesaService.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const get = asyncHandler(async (req, res) => {
  const wallet = await CustomerWallet.findOne({ customer: req.customer._id }).lean();
  if (!wallet) throw new ApiError(404, "Wallet not found");
  res.status(200).json(new ApiResponse(200, wallet));
});

const topUp = asyncHandler(async (req, res) => {
  const { amount, phone } = req.body;

  if (!amount || amount <= 0) throw new ApiError(400, "Invalid amount");

  const reference = generateRef("TOP");
  const payment = await CustomerPayment.create({
    customer: req.customer._id,
    reference,
    method: "mpesa",
    purpose: "topup",
    amount,
    status: "pending",
    meta: { phone },
  });

  const result = await mpesaService.initiateSTKPush({
    phone: phone || req.customer.phone,
    amount,
    accountReference: reference,
    description: "Wallet top up",
  });

  if (!result.success) {
    payment.status = "failed";
    payment.failureReason = result.error?.errorMessage || "STK failed";
    await payment.save();
    throw new ApiError(400, result.error?.errorMessage || "Failed to initiate top up");
  }

  payment.meta = {
    ...payment.meta,
    checkoutRequestId: result.checkoutRequestId,
    merchantRequestId: result.merchantRequestId,
  };
  await payment.save();

  res.status(200).json(
    new ApiResponse(200, { reference, checkoutRequestId: result.checkoutRequestId }, result.customerMessage)
  );
});

const confirmTopUp = asyncHandler(async (req, res) => {
  const { reference } = req.body;

  const payment = await CustomerPayment.findOne({ reference, customer: req.customer._id });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "pending") throw new ApiError(400, "Payment already processed");

  const statusResult = await mpesaService.querySTKStatus(payment.meta.checkoutRequestId);
  if (!statusResult.success || statusResult.resultCode !== "0") {
    throw new ApiError(400, statusResult.resultDesc || "Payment not completed");
  }

  payment.status = "success";
  await payment.save();

  const wallet = await CustomerWallet.findOne({ customer: req.customer._id });
  wallet.balance += payment.amount;
  wallet.totalCredited += payment.amount;
  await wallet.save();

  const { branding, settings } = await getContext();
  await emailService.walletToppedUp(req.customer, {
    amount: `KES ${payment.amount}`,
    balance: `KES ${wallet.balance}`,
    branding,
    settings,
  });

  res.status(200).json(new ApiResponse(200, { balance: wallet.balance }, "Wallet topped up"));
});

export { get, topUp, confirmTopUp };