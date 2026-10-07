import hdmBridge from "../config/hdmBridge.js";
import brevo from "../config/brevo.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import * as templates from "../templates/emailTemplates.js";

const sendViaHdm = async ({ to, subject, html, text, attachments }) => {
  const payload = {
    from: env.hdmFromEmail,
    fromName: env.hdmFromName,
    to,
    subject,
    htmlBody: html,
    textBody: text,
  };
  if (attachments) payload.attachments = attachments;
  const { data } = await hdmBridge.post("/emails/send", payload);
  return data;
};

const sendViaBrevo = async ({ to, subject, html, text, attachments }) => {
  const payload = {
    sender: { email: env.brevoSenderEmail, name: env.brevoSenderName },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (attachments) {
    payload.attachment = attachments.map((a) => ({
      name: a.filename,
      content: Buffer.from(a.content).toString("base64"),
    }));
  }
  const { data } = await brevo.post("/smtp/email", payload);
  return data;
};

const dispatch = async ({ to, subject, html, text, attachments }) => {
  if (env.emailProvider === "brevo") {
    return sendViaBrevo({ to, subject, html, text, attachments });
  }
  return sendViaHdm({ to, subject, html, text, attachments });
};

const deliver = async (templateName, recipient, payload = {}) => {
  const templateFn = templates[templateName];

  if (typeof templateFn !== "function") {
    throw new Error(`Unknown email template: ${templateName}`);
  }

  const branding = payload.branding || {};
  const settings = payload.settings || {};

  const rendered = templateFn(recipient, payload, branding, settings);

  if (!rendered || !rendered.subject || !rendered.html) {
    throw new Error(`Template ${templateName} returned invalid output`);
  }

  const sizeBytes = Buffer.byteLength(rendered.html, "utf8");
  logger.info(`Sending email via template ${templateName}`, {
    to: recipient.email,
    sizeKb: Math.round(sizeBytes / 1024),
  });

  try {
    return await dispatch({
      to: recipient.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: payload.attachments,
    });
  } catch (err) {
    logger.error("Email send failed", {
      template: templateName,
      to: recipient.email,
      error: err.response?.data || err.message,
    });
    throw err;
  }
};
const welcomeCustomer = (recipient, payload = {}) =>
  deliver("welcomeCustomer", recipient, payload);

const emailVerificationLink = (recipient, payload = {}) =>
  deliver("emailVerificationLink", recipient, payload);

const passwordResetOTP = (recipient, payload = {}) =>
  deliver("passwordResetOTP", recipient, payload);

const passwordChanged = (recipient, payload = {}) =>
  deliver("passwordChanged", recipient, payload);

const newDeviceLogin = (recipient, payload = {}) =>
  deliver("newDeviceLogin", recipient, payload);

const accountSuspended = (recipient, payload = {}) =>
  deliver("accountSuspended", recipient, payload);

const accountReactivated = (recipient, payload = {}) =>
  deliver("accountReactivated", recipient, payload);

const accountDeleted = (recipient, payload = {}) =>
  deliver("accountDeleted", recipient, payload);

const bookingConfirmation = (recipient, payload = {}) =>
  deliver("bookingConfirmation", recipient, payload);

const bookingReminder24h = (recipient, payload = {}) =>
  deliver("bookingReminder24h", recipient, payload);

const bookingReminder2h = (recipient, payload = {}) =>
  deliver("bookingReminder2h", recipient, payload);

const bookingModified = (recipient, payload = {}) =>
  deliver("bookingModified", recipient, payload);

const bookingCancelled = (recipient, payload = {}) =>
  deliver("bookingCancelled", recipient, payload);

const checkInConfirmation = (recipient, payload = {}) =>
  deliver("checkInConfirmation", recipient, payload);

const checkOutConfirmation = (recipient, payload = {}) =>
  deliver("checkOutConfirmation", recipient, payload);

const refundProcessed = (recipient, payload = {}) =>
  deliver("refundProcessed", recipient, payload);

const reviewRequest = (recipient, payload = {}) =>
  deliver("reviewRequest", recipient, payload);

const orderConfirmation = (recipient, payload = {}) =>
  deliver("orderConfirmation", recipient, payload);

const orderAccepted = (recipient, payload = {}) =>
  deliver("orderAccepted", recipient, payload);

const orderPreparing = (recipient, payload = {}) =>
  deliver("orderPreparing", recipient, payload);

const orderOutForDelivery = (recipient, payload = {}) =>
  deliver("orderOutForDelivery", recipient, payload);

const orderDelivered = (recipient, payload = {}) =>
  deliver("orderDelivered", recipient, payload);

const orderCancelled = (recipient, payload = {}) =>
  deliver("orderCancelled", recipient, payload);

const deliveryReceipt = (recipient, payload = {}) =>
  deliver("deliveryReceipt", recipient, payload);

const dineInBookingConfirmation = (recipient, payload = {}) =>
  deliver("dineInBookingConfirmation", recipient, payload);

const dineInReminder = (recipient, payload = {}) =>
  deliver("dineInReminder", recipient, payload);

const dineInAccepted = (recipient, payload = {}) =>
  deliver("dineInAccepted", recipient, payload);

const dineInCancelled = (recipient, payload = {}) =>
  deliver("dineInCancelled", recipient, payload);

const pickupReady = (recipient, payload = {}) =>
  deliver("pickupReady", recipient, payload);

const pickupCompleted = (recipient, payload = {}) =>
  deliver("pickupCompleted", recipient, payload);

const tripBookingConfirmation = (recipient, payload = {}) =>
  deliver("tripBookingConfirmation", recipient, payload);

const driverAssigned = (recipient, payload = {}) =>
  deliver("driverAssigned", recipient, payload);

const driverArrivingSoon = (recipient, payload = {}) =>
  deliver("driverArrivingSoon", recipient, payload);

const tripStarted = (recipient, payload = {}) =>
  deliver("tripStarted", recipient, payload);

const tripCompleted = (recipient, payload = {}) =>
  deliver("tripCompleted", recipient, payload);

const tripCancelled = (recipient, payload = {}) =>
  deliver("tripCancelled", recipient, payload);

const paymentReceived = (recipient, payload = {}) =>
  deliver("paymentReceived", recipient, payload);

const paymentFailed = (recipient, payload = {}) =>
  deliver("paymentFailed", recipient, payload);

const walletToppedUp = (recipient, payload = {}) =>
  deliver("walletToppedUp", recipient, payload);

const refundIssued = (recipient, payload = {}) =>
  deliver("refundIssued", recipient, payload);

const payoutToWallet = (recipient, payload = {}) =>
  deliver("payoutToWallet", recipient, payload);

const partnerApplicationReceived = (recipient, payload = {}) =>
  deliver("partnerApplicationReceived", recipient, payload);

const partnerApproved = (recipient, payload = {}) =>
  deliver("partnerApproved", recipient, payload);

const partnerRejected = (recipient, payload = {}) =>
  deliver("partnerRejected", recipient, payload);

const partnerSuspended = (recipient, payload = {}) =>
  deliver("partnerSuspended", recipient, payload);

const partnerReactivated = (recipient, payload = {}) =>
  deliver("partnerReactivated", recipient, payload);

const vehicleApproved = (recipient, payload = {}) =>
  deliver("vehicleApproved", recipient, payload);

const vehicleRejected = (recipient, payload = {}) =>
  deliver("vehicleRejected", recipient, payload);

const propertyApproved = (recipient, payload = {}) =>
  deliver("propertyApproved", recipient, payload);

const propertyRejected = (recipient, payload = {}) =>
  deliver("propertyRejected", recipient, payload);

const roomApproved = (recipient, payload = {}) =>
  deliver("roomApproved", recipient, payload);

const newOrderReceived = (recipient, payload = {}) =>
  deliver("newOrderReceived", recipient, payload);

const newBroadcastReceived = (recipient, payload = {}) =>
  deliver("newBroadcastReceived", recipient, payload);

const orderCancelledByCustomer = (recipient, payload = {}) =>
  deliver("orderCancelledByCustomer", recipient, payload);

const newTripRequest = (recipient, payload = {}) =>
  deliver("newTripRequest", recipient, payload);

const newBookingReceived = (recipient, payload = {}) =>
  deliver("newBookingReceived", recipient, payload);

const guestCheckedIn = (recipient, payload = {}) =>
  deliver("guestCheckedIn", recipient, payload);

const guestCheckedOut = (recipient, payload = {}) =>
  deliver("guestCheckedOut", recipient, payload);

const paymentReceivedPartner = (recipient, payload = {}) =>
  deliver("paymentReceivedPartner", recipient, payload);

const payoutProcessed = (recipient, payload = {}) =>
  deliver("payoutProcessed", recipient, payload);

const payoutFailed = (recipient, payload = {}) =>
  deliver("payoutFailed", recipient, payload);

const weeklyEarningsSummary = (recipient, payload = {}) =>
  deliver("weeklyEarningsSummary", recipient, payload);

const reviewReceived = (recipient, payload = {}) =>
  deliver("reviewReceived", recipient, payload);

const adminNewPartnerApplication = (recipient, payload = {}) =>
  deliver("adminNewPartnerApplication", recipient, payload);

const adminNewDispute = (recipient, payload = {}) =>
  deliver("adminNewDispute", recipient, payload);

const adminNewContact = (recipient, payload = {}) =>
  deliver("adminNewContact", recipient, payload);

const adminPayoutApprovalRequired = (recipient, payload = {}) =>
  deliver("adminPayoutApprovalRequired", recipient, payload);

const adminManualPayoutRequest = (recipient, payload = {}) =>
  deliver("adminManualPayoutRequest", recipient, payload);

const adminCommissionLedgerAlert = (recipient, payload = {}) =>
  deliver("adminCommissionLedgerAlert", recipient, payload);

const adminFailedPayment = (recipient, payload = {}) =>
  deliver("adminFailedPayment", recipient, payload);

const adminFailedPayout = (recipient, payload = {}) =>
  deliver("adminFailedPayout", recipient, payload);

const adminBackupCompleted = (recipient, payload = {}) =>
  deliver("adminBackupCompleted", recipient, payload);

const adminBackupFailed = (recipient, payload = {}) =>
  deliver("adminBackupFailed", recipient, payload);

const adminRevenueSummary = (recipient, payload = {}) =>
  deliver("adminRevenueSummary", recipient, payload);

const adminSystemHealthAlert = (recipient, payload = {}) =>
  deliver("adminSystemHealthAlert", recipient, payload);

const adminInvited = (recipient, payload = {}) =>
  deliver("adminInvited", recipient, payload);

const adminAccountCreated = (recipient, payload = {}) =>
  deliver("adminAccountCreated", recipient, payload);

const adminRoleChanged = (recipient, payload = {}) =>
  deliver("adminRoleChanged", recipient, payload);

const adminAccountSuspended = (recipient, payload = {}) =>
  deliver("adminAccountSuspended", recipient, payload);

const welcomeSeriesDay0 = (recipient, payload = {}) =>
  deliver("welcomeSeriesDay0", recipient, payload);

const welcomeSeriesDay3 = (recipient, payload = {}) =>
  deliver("welcomeSeriesDay3", recipient, payload);

const welcomeSeriesDay7 = (recipient, payload = {}) =>
  deliver("welcomeSeriesDay7", recipient, payload);

const promotionalOffer = (recipient, payload = {}) =>
  deliver("promotionalOffer", recipient, payload);

const newRestaurantInTown = (recipient, payload = {}) =>
  deliver("newRestaurantInTown", recipient, payload);

const newAccommodationInTown = (recipient, payload = {}) =>
  deliver("newAccommodationInTown", recipient, payload);

const seasonalDeals = (recipient, payload = {}) =>
  deliver("seasonalDeals", recipient, payload);

const abandonedBookingReminder = (recipient, payload = {}) =>
  deliver("abandonedBookingReminder", recipient, payload);

const abandonedOrderReminder = (recipient, payload = {}) =>
  deliver("abandonedOrderReminder", recipient, payload);

const loyaltyMilestone = (recipient, payload = {}) =>
  deliver("loyaltyMilestone", recipient, payload);

const referralRewardEarned = (recipient, payload = {}) =>
  deliver("referralRewardEarned", recipient, payload);

const referralJoined = (recipient, payload = {}) =>
  deliver("referralJoined", recipient, payload);

const birthdayOffer = (recipient, payload = {}) =>
  deliver("birthdayOffer", recipient, payload);

const reEngagement = (recipient, payload = {}) =>
  deliver("reEngagement", recipient, payload);

const newsletter = (recipient, payload = {}) =>
  deliver("newsletter", recipient, payload);

const twoFactorCode = (recipient, payload = {}) =>
  deliver("twoFactorCode", recipient, payload);

const sessionRevoked = (recipient, payload = {}) =>
  deliver("sessionRevoked", recipient, payload);

const suspiciousActivity = (recipient, payload = {}) =>
  deliver("suspiciousActivity", recipient, payload);

const legalPolicyUpdate = (recipient, payload = {}) =>
  deliver("legalPolicyUpdate", recipient, payload);

const termsAcceptanceReminder = (recipient, payload = {}) =>
  deliver("termsAcceptanceReminder", recipient, payload);

const dataExportReady = (recipient, payload = {}) =>
  deliver("dataExportReady", recipient, payload);

const accountDeletionScheduled = (recipient, payload = {}) =>
  deliver("accountDeletionScheduled", recipient, payload);

const changeContactOTP = (recipient, payload = {}) =>
  deliver("changeContactOTP", recipient, payload);

export {
  welcomeCustomer,
  emailVerificationLink,
  passwordResetOTP,
  passwordChanged,
  newDeviceLogin,
  accountSuspended,
  accountReactivated,
  accountDeleted,
  bookingConfirmation,
  bookingReminder24h,
  bookingReminder2h,
  bookingModified,
  bookingCancelled,
  checkInConfirmation,
  checkOutConfirmation,
  refundProcessed,
  reviewRequest,
  orderConfirmation,
  orderAccepted,
  orderPreparing,
  orderOutForDelivery,
  orderDelivered,
  orderCancelled,
  deliveryReceipt,
  dineInBookingConfirmation,
  dineInReminder,
  dineInAccepted,
  dineInCancelled,
  pickupReady,
  pickupCompleted,
  tripBookingConfirmation,
  driverAssigned,
  driverArrivingSoon,
  tripStarted,
  tripCompleted,
  tripCancelled,
  paymentReceived,
  paymentFailed,
  walletToppedUp,
  refundIssued,
  payoutToWallet,
  partnerApplicationReceived,
  partnerApproved,
  partnerRejected,
  partnerSuspended,
  partnerReactivated,
  vehicleApproved,
  vehicleRejected,
  propertyApproved,
  propertyRejected,
  roomApproved,
  newOrderReceived,
  newBroadcastReceived,
  orderCancelledByCustomer,
  newTripRequest,
  newBookingReceived,
  guestCheckedIn,
  guestCheckedOut,
  paymentReceivedPartner,
  payoutProcessed,
  payoutFailed,
  weeklyEarningsSummary,
  reviewReceived,
  adminNewPartnerApplication,
  adminNewDispute,
  adminNewContact,
  adminPayoutApprovalRequired,
  adminManualPayoutRequest,
  adminCommissionLedgerAlert,
  adminFailedPayment,
  adminFailedPayout,
  adminBackupCompleted,
  adminBackupFailed,
  adminRevenueSummary,
  adminSystemHealthAlert,
  adminInvited,
  adminAccountCreated,
  adminRoleChanged,
  adminAccountSuspended,
  welcomeSeriesDay0,
  welcomeSeriesDay3,
  welcomeSeriesDay7,
  promotionalOffer,
  newRestaurantInTown,
  newAccommodationInTown,
  seasonalDeals,
  abandonedBookingReminder,
  abandonedOrderReminder,
  loyaltyMilestone,
  referralRewardEarned,
  referralJoined,
  birthdayOffer,
  reEngagement,
  newsletter,
  twoFactorCode,
  sessionRevoked,
  suspiciousActivity,
  legalPolicyUpdate,
  termsAcceptanceReminder,
  dataExportReady,
  accountDeletionScheduled,
  changeContactOTP,
};