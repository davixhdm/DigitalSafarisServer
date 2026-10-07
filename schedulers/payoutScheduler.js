import RestaurantWallet from "../models/rest/RestaurantWallet.js";
import TransportWallet from "../models/trans/TransportWallet.js";
import AccommodationWallet from "../models/accom/AccommodationWallet.js";
import Payout from "../models/admin/Payout.js";
import SystemSetting from "../models/admin/SystemSetting.js";
import { generateRef } from "../utils/helpers.js";
import logger from "../utils/logger.js";

const getPayoutSettings = async () => {
  const doc = await SystemSetting.findOne({ key: "payout" });
  return (
    doc?.value || {
      minAmount: 500,
      schedule: "weekly",
      day: "friday",
      time: "17:00",
    }
  );
};

const processWallet = async (wallet, partnerType, settings) => {
  if (!wallet || wallet.balance <= 0) return null;
  if (wallet.balance < (wallet.minimumPayout || settings.minAmount)) return null;

  const payout = await Payout.create({
    partner: wallet.partner,
    partnerType,
    amount: wallet.balance,
    method: wallet.payoutMethod,
    type: "auto",
    status: "pending",
    reference: generateRef("PAY"),
    meta: {
      phone: wallet.payoutDetails?.phone || null,
      bank: wallet.payoutDetails?.bankName || null,
      accountNumber: wallet.payoutDetails?.accountNumber || null,
    },
  });

  wallet.pendingPayout = wallet.balance;
  wallet.balance = 0;
  wallet.lastPayoutAt = new Date();
  await wallet.save();

  return payout;
};

const runPayoutJob = async () => {
  const settings = await getPayoutSettings();
  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  if (settings.schedule === "weekly" && dayNames[now.getDay()] !== settings.day) return;
  if (settings.schedule === "monthly" && now.getDate() !== 1) return;

  const [rh, rm] = settings.time.split(":").map(Number);
  if (now.getHours() !== rh || now.getMinutes() !== rm) return;

  const [restWallets, transWallets, accomWallets] = await Promise.all([
    RestaurantWallet.find({ status: "active" }),
    TransportWallet.find({ status: "active" }),
    AccommodationWallet.find({ status: "active" }),
  ]);

  let count = 0;
  for (const w of restWallets) if (await processWallet(w, "restaurant", settings)) count++;
  for (const w of transWallets) if (await processWallet(w, "transport", settings)) count++;
  for (const w of accomWallets) if (await processWallet(w, "accommodation", settings)) count++;

  logger.info(`Payout job completed. ${count} payouts queued.`);
};

export { runPayoutJob };