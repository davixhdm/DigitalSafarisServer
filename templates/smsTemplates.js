const render = (message) => message;

const welcomeCustomer = (recipient) =>
  render(`Welcome to Digital Safaris, ${recipient.firstName}! Start exploring now.`);

const emailVerificationOTP = (payload) =>
  render(`Your Digital Safaris email verification code is ${payload.otp}. Expires in 10 minutes.`);

const passwordResetOTP = (payload) =>
  render(`Your Digital Safaris password reset code is ${payload.otp}. Expires in 10 minutes.`);

const passwordChanged = () =>
  render(`Your Digital Safaris password was changed. If this wasn't you, contact support immediately.`);

const newDeviceLogin = (payload) =>
  render(`New login to your Digital Safaris account from ${payload.device}. If this wasn't you, reset your password.`);

const accountSuspended = (payload) =>
  render(`Your Digital Safaris account has been suspended. Reason: ${payload.reason}. Contact support.`);

const accountReactivated = () =>
  render(`Your Digital Safaris account has been reactivated. Welcome back.`);

const accountDeleted = () =>
  render(`Your Digital Safaris account has been deleted. Thank you for using our service.`);

const bookingConfirmation = (payload) =>
  render(`Booking confirmed. Ref: ${payload.reference}. Check-in: ${payload.checkIn}. Digital Safaris.`);

const bookingReminder24h = (payload) =>
  render(`Reminder: Your check-in at ${payload.property} is tomorrow. Ref: ${payload.reference}.`);

const bookingReminder2h = (payload) =>
  render(`Check-in at ${payload.property} in 2 hours. Ref: ${payload.reference}. Have your QR ready.`);

const bookingModified = (payload) =>
  render(`Your Digital Safaris booking ${payload.reference} has been updated.`);

const bookingCancelled = (payload) =>
  render(`Booking ${payload.reference} cancelled. Reason: ${payload.reason || "not provided"}. Refunds in 3-5 days.`);

const checkInConfirmation = (payload) =>
  render(`Checked in at ${payload.property}. Enjoy your stay. Digital Safaris.`);

const checkOutConfirmation = (payload) =>
  render(`Checked out from ${payload.property}. Thank you for staying. Digital Safaris.`);

const refundProcessed = (payload) =>
  render(`Refund of ${payload.amount} for ${payload.reference} processed. Funds in 3-5 days.`);

const reviewRequest = (payload) =>
  render(`How was ${payload.targetName}? Leave a review on Digital Safaris.`);

const orderConfirmation = (payload) =>
  render(`Order ${payload.reference} confirmed. Total: ${payload.total}. Digital Safaris.`);

const orderAccepted = (payload) =>
  render(`Order ${payload.reference} accepted by ${payload.restaurant}. Digital Safaris.`);

const orderPreparing = (payload) =>
  render(`Your order ${payload.reference} is being prepared. Digital Safaris.`);

const orderOutForDelivery = (payload) =>
  render(`Order ${payload.reference} out for delivery. Driver: ${payload.driverName} ${payload.driverPhone}.`);

const orderDelivered = (payload) =>
  render(`Order ${payload.reference} delivered. Enjoy your meal. Digital Safaris.`);

const orderCancelled = (payload) =>
  render(`Order ${payload.reference} cancelled. Reason: ${payload.reason || "not provided"}. Refunds in 3-5 days.`);

const deliveryReceipt = (payload) =>
  render(`Receipt for order ${payload.reference}: ${payload.total}. Digital Safaris.`);

const dineInBookingConfirmation = (payload) =>
  render(`Table confirmed at ${payload.restaurant}. Ref: ${payload.reference}. Time: ${payload.scheduledAt}.`);

const dineInReminder = (payload) =>
  render(`Reminder: Table at ${payload.restaurant} in 2 hours. Ref: ${payload.reference}.`);

const dineInAccepted = (payload) =>
  render(`Booking ${payload.reference} accepted by ${payload.restaurant}. Digital Safaris.`);

const dineInCancelled = (payload) =>
  render(`Booking ${payload.reference} cancelled. Reason: ${payload.reason || "not provided"}.`);

const pickupReady = (payload) =>
  render(`Order ${payload.reference} ready for pickup at ${payload.restaurant}. Digital Safaris.`);

const pickupCompleted = (payload) =>
  render(`Pickup ${payload.reference} completed. Thank you. Digital Safaris.`);

const tripBookingConfirmation = (payload) =>
  render(`Trip ${payload.reference} confirmed. Pickup: ${payload.pickup} at ${payload.scheduledAt}.`);

const driverAssigned = (payload) =>
  render(`Driver ${payload.driverName} assigned to trip ${payload.reference}. Phone: ${payload.driverPhone}.`);

const driverArrivingSoon = (payload) =>
  render(`Your driver ${payload.driverName} is arriving soon. Phone: ${payload.driverPhone}.`);

const tripStarted = (payload) =>
  render(`Trip ${payload.reference} started. Safe travels. Digital Safaris.`);

const tripCompleted = (payload) =>
  render(`Trip ${payload.reference} completed. Fare: ${payload.fare}. Thank you.`);

const tripCancelled = (payload) =>
  render(`Trip ${payload.reference} cancelled. Reason: ${payload.reason || "not provided"}.`);

const paymentReceived = (payload) =>
  render(`Payment of ${payload.amount} received. Ref: ${payload.reference}. Digital Safaris.`);

const paymentFailed = (payload) =>
  render(`Payment ${payload.reference} failed. Reason: ${payload.reason || "unknown"}. Try again.`);

const walletToppedUp = (payload) =>
  render(`Wallet topped up by ${payload.amount}. New balance: ${payload.balance}. Digital Safaris.`);

const refundIssued = (payload) =>
  render(`Refund of ${payload.amount} issued for ${payload.reference}. Digital Safaris.`);

const payoutToWallet = (payload) =>
  render(`Payout of ${payload.amount} credited. New balance: ${payload.balance}. Digital Safaris.`);

const partnerApplicationReceived = (recipient) =>
  render(`Hi ${recipient.firstName || recipient.name}, your Digital Safaris partner application was received.`);

const partnerApproved = (recipient) =>
  render(`Your Digital Safaris partner account has been approved. Log in to start.`);

const partnerRejected = (payload) =>
  render(`Your Digital Safaris partner application was not approved. Reason: ${payload.reason || "not provided"}.`);

const partnerSuspended = (payload) =>
  render(`Your Digital Safaris partner account has been suspended. Reason: ${payload.reason}.`);

const partnerReactivated = () =>
  render(`Your Digital Safaris partner account has been reactivated.`);

const vehicleApproved = (payload) =>
  render(`Vehicle ${payload.plate} approved. Digital Safaris.`);

const vehicleRejected = (payload) =>
  render(`Vehicle ${payload.plate} not approved. Reason: ${payload.reason || "not provided"}.`);

const propertyApproved = (payload) =>
  render(`Property ${payload.name} approved. Digital Safaris.`);

const propertyRejected = (payload) =>
  render(`Property ${payload.name} not approved. Reason: ${payload.reason || "not provided"}.`);

const roomApproved = (payload) =>
  render(`Room ${payload.name} approved and live. Digital Safaris.`);

const newOrderReceived = (payload) =>
  render(`New order ${payload.reference}. Total: ${payload.total}. Digital Safaris.`);

const newBroadcastReceived = (payload) =>
  render(`New broadcast: ${payload.foodType}. Budget: ${payload.budget}. Open app to accept.`);

const orderCancelledByCustomer = (payload) =>
  render(`Order ${payload.reference} cancelled by customer. Reason: ${payload.reason || "not provided"}.`);

const newTripRequest = (payload) =>
  render(`New trip request. Pickup: ${payload.pickup}. Dropoff: ${payload.dropoff}. Fare: ${payload.fare}.`);

const newBookingReceived = (payload) =>
  render(`New booking ${payload.reference}. In: ${payload.checkIn}. Out: ${payload.checkOut}.`);

const guestCheckedIn = (payload) =>
  render(`Guest ${payload.guestName} checked in for ${payload.reference}. Digital Safaris.`);

const guestCheckedOut = (payload) =>
  render(`Guest ${payload.guestName} checked out from ${payload.reference}. Digital Safaris.`);

const paymentReceivedPartner = (payload) =>
  render(`Payment of ${payload.amount} received for ${payload.reference}. Digital Safaris.`);

const payoutProcessed = (payload) =>
  render(`Payout of ${payload.amount} processed via ${payload.method}. Ref: ${payload.reference}.`);

const payoutFailed = (payload) =>
  render(`Payout of ${payload.amount} failed. Reason: ${payload.reason || "unknown"}. Contact support.`);

const weeklyEarningsSummary = (payload) =>
  render(`Weekly earnings: ${payload.net}. Orders: ${payload.orders}. Digital Safaris.`);

const reviewReceived = (payload) =>
  render(`New ${payload.rating}-star review received on Digital Safaris.`);

const adminNewPartnerApplication = (payload) =>
  render(`New ${payload.partnerType} partner application: ${payload.name}. Digital Safaris admin.`);

const adminNewDispute = (payload) =>
  render(`New dispute ${payload.reference}. Category: ${payload.category}. Digital Safaris admin.`);

const adminNewContact = (payload) =>
  render(`New contact from ${payload.name} (${payload.email}). Digital Safaris admin.`);

const adminPayoutApprovalRequired = (payload) =>
  render(`Payout approval required: ${payload.reference} - ${payload.amount}. Digital Safaris admin.`);

const adminManualPayoutRequest = (payload) =>
  render(`Manual payout request: ${payload.reference} - ${payload.amount}. Digital Safaris admin.`);

const adminCommissionLedgerAlert = (payload) =>
  render(`Commission owed: ${payload.amount} by ${payload.partnerName}. Digital Safaris admin.`);

const adminFailedPayment = (payload) =>
  render(`Failed payment: ${payload.reference}. Digital Safaris admin.`);

const adminFailedPayout = (payload) =>
  render(`Failed payout: ${payload.reference}. Digital Safaris admin.`);

const adminBackupCompleted = (payload) =>
  render(`Backup completed: ${payload.filename}. Digital Safaris admin.`);

const adminBackupFailed = (payload) =>
  render(`Backup failed: ${payload.reason}. Digital Safaris admin.`);

const adminRevenueSummary = (payload) =>
  render(`${payload.period} revenue: ${payload.total}. Digital Safaris admin.`);

const adminSystemHealthAlert = (payload) =>
  render(`System alert: ${payload.title}. Digital Safaris admin.`);

const adminInvited = (payload) =>
  render(`You've been invited as admin on Digital Safaris. Temp password: ${payload.tempPassword}.`);

const adminAccountCreated = () =>
  render(`Your Digital Safaris admin account has been created.`);

const adminRoleChanged = (payload) =>
  render(`Your role changed from ${payload.oldRole} to ${payload.newRole}. Digital Safaris.`);

const adminAccountSuspended = (payload) =>
  render(`Your Digital Safaris admin account has been suspended. Reason: ${payload.reason}.`);

const twoFactorCode = (payload) =>
  render(`Your Digital Safaris 2FA code is ${payload.code}.`);

const sessionRevoked = (payload) =>
  render(`A session on ${payload.device} was revoked. Digital Safaris.`);

const suspiciousActivity = (payload) =>
  render(`Suspicious activity on your Digital Safaris account: ${payload.activity}. Contact support.`);

const accountDeletionScheduled = (payload) =>
  render(`Your Digital Safaris account is scheduled for deletion on ${payload.date}.`);

const changeContactOTP = (payload) =>
  render(`Your Digital Safaris ${payload.type} change code is ${payload.otp}. Expires in 10 minutes.`);

export {
  welcomeCustomer,
  emailVerificationOTP,
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
  twoFactorCode,
  sessionRevoked,
  suspiciousActivity,
  accountDeletionScheduled,
  changeContactOTP,
};