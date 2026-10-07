import { buildEmailLayout, buildEmailText } from "./emailLayout.js";

const render = (ctx, bodyHtml, extra = {}) => ({
  subject: extra.subject || "",
  html: buildEmailLayout({ ...ctx, ...extra, bodyHtml }),
  text: buildEmailText(extra.textLines || []),
});

const resolveContext = (payload = {}) => {
  const branding = payload.branding || {};
  const settings = payload.settings || {};
  return {
    logoUrl: branding.logoUrl || branding.logo || null,
    appName: settings.appName || "Digital Safaris",
    primaryColor: branding.primaryColor || "#1A1F2E",
    secondaryColor: branding.secondaryColor || "#C9A063",
    supportEmail: settings.supportEmail || "support@digitalsafaris.com",
    supportPhone: settings.supportPhone || "",
    websiteUrl: settings.websiteUrl || "https://digitalsafaris.com",
    legalTermsUrl: settings.legalTermsUrl || "https://digitalsafaris.com/terms",
    legalPrivacyUrl: settings.legalPrivacyUrl || "https://digitalsafaris.com/privacy",
  };
};

const welcomeCustomer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Welcome, ${recipient.firstName}!</h2>
    <p>Your Digital Safaris account is ready. You can now book accommodations, order food, and request transport — all in one place.</p>
    <p style="margin-top:24px;">
      <a href="${ctx.websiteUrl}" style="background-color:${ctx.secondaryColor};color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Explore Now</a>
    </p>
    <p style="margin-top:24px;">If you have any questions, reply to this email or contact us at ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Welcome to ${ctx.appName}`,
    textLines: [`Welcome, ${recipient.firstName}!`, `Explore: ${ctx.websiteUrl}`, `Support: ${ctx.supportEmail}`],
  });
};

const emailVerificationLink = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { link } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Verify Your Email</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Thanks for signing up. Click the button below to verify your email and activate your account.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="background-color:${ctx.secondaryColor};color:#FFFFFF;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Verify Email</a>
    </p>
    <p>Or paste this link into your browser:</p>
    <p style="font-family:monospace;font-size:12px;word-break:break-all;background-color:#F5F5F5;padding:12px;border-radius:6px;">${link}</p>
    <p>This link expires in 48 hours.</p>
    <p>If you did not create this account, ignore this email.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Verify your email — ${ctx.appName}`,
    textLines: [`Verify your email: ${link}`, `Link expires in 48 hours.`],
  });
};

const passwordResetOTP = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Reset Your Password</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Use the code below to reset your password. It expires in 10 minutes.</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:${ctx.secondaryColor};margin:24px 0;text-align:center;">${payload.otp}</p>
    <p>If you did not request this, ignore this email.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Password reset code - ${payload.otp}`,
    textLines: [`Your password reset code is ${payload.otp}. Expires in 10 minutes.`],
  });
};

const passwordChanged = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Password Changed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your password was successfully changed.</p>
    <p>If this wasn't you, contact us immediately at ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your password was changed`,
    textLines: [`Your Digital Safaris password was changed.`],
  });
};

const newDeviceLogin = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Login Detected</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A new login was detected on your account from:</p>
    <p style="background-color:#F5F5F5;padding:12px;border-radius:6px;font-family:monospace;">${payload.device}</p>
    <p>If this wasn't you, reset your password immediately and contact ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New login to your account`,
    textLines: [`New login detected: ${payload.device}`],
  });
};

const accountSuspended = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Account Suspended</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your account has been suspended.</p>
    <p><strong>Reason:</strong> ${payload.reason}</p>
    <p>Contact ${ctx.supportEmail} for assistance.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your account has been suspended`,
    textLines: [`Your account was suspended. Reason: ${payload.reason}`],
  });
};

const accountReactivated = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Account Reactivated</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your account has been reactivated. You can now use all services.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your account is active again`,
    textLines: [`Your account has been reactivated.`],
  });
};

const accountDeleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Account Deleted</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your account has been permanently deleted. We're sorry to see you go.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your account has been deleted`,
    textLines: [`Your Digital Safaris account has been deleted.`],
  });
};

const bookingConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Booking Confirmed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your stay at <strong>${property.name}</strong> is confirmed.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#6B7280;">Reference</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${booking.reference}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;">Check-in</td><td style="padding:8px 0;text-align:right;">${new Date(booking.checkIn).toDateString()}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;">Check-out</td><td style="padding:8px 0;text-align:right;">${new Date(booking.checkOut).toDateString()}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:${ctx.secondaryColor};">${booking.currency} ${booking.total}</td></tr>
    </table>
    <p>We look forward to hosting you!</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Booking confirmed - ${booking.reference}`,
    textLines: [`Booking confirmed at ${property.name}`, `Reference: ${booking.reference}`],
  });
};

const bookingReminder24h = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your Stay is Tomorrow</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your check-in at <strong>${property.name}</strong> is tomorrow.</p>
    <p><strong>Address:</strong> ${property.address}, ${property.town}</p>
    <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toDateString()}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Reminder: Check-in tomorrow at ${property.name}`,
    textLines: [`Check-in tomorrow at ${property.name}.`],
  });
};

const bookingReminder2h = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Check-in in 2 Hours</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your check-in at <strong>${property.name}</strong> is in 2 hours.</p>
    <p>Have your QR code ready at reception.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Check-in in 2 hours at ${property.name}`,
    textLines: [`Check-in in 2 hours at ${property.name}.`],
  });
};

const bookingModified = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Booking Modified</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your booking <strong>${booking.reference}</strong> has been updated.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Booking updated - ${booking.reference}`,
    textLines: [`Booking ${booking.reference} updated.`],
  });
};

const bookingCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Booking Cancelled</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your booking <strong>${booking.reference}</strong> has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
    <p>Any refund due will be processed within 3-5 business days.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Booking cancelled - ${booking.reference}`,
    textLines: [`Booking ${booking.reference} cancelled.`],
  });
};

const checkInConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Checked In</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You are checked in at <strong>${property.name}</strong>. Enjoy your stay!</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Welcome to ${property.name}`,
    textLines: [`Checked in at ${property.name}.`],
  });
};

const checkOutConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Checked Out</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Thank you for staying at <strong>${property.name}</strong>. We'd love a review.</p>
    <p style="margin-top:16px;">
      <a href="${ctx.websiteUrl}" style="background-color:${ctx.secondaryColor};color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Leave a Review</a>
    </p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Thanks for staying at ${property.name}`,
    textLines: [`Thank you for staying at ${property.name}.`],
  });
};

const refundProcessed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, reference } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Refund Processed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A refund of <strong>${amount}</strong> has been processed for <strong>${reference}</strong>.</p>
    <p>Funds may take 3-5 business days to reflect.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Refund processed - ${reference}`,
    textLines: [`Refund of ${amount} for ${reference} processed.`],
  });
};

const reviewRequest = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { targetName } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">How was your experience?</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>How was <strong>${targetName}</strong>? Your review helps others make better choices.</p>
    <p style="margin-top:16px;">
      <a href="${ctx.websiteUrl}" style="background-color:${ctx.secondaryColor};color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Write a Review</a>
    </p>
  `;
  return render(ctx, bodyHtml, {
    subject: `How was ${targetName}?`,
    textLines: [`Please review ${targetName}.`],
  });
};

const orderConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const itemsRows = order.items
    .map((i) => `<tr><td style="padding:6px 0;">${i.name} x ${i.quantity}</td><td style="padding:6px 0;text-align:right;">${order.currency} ${i.subtotal}</td></tr>`)
    .join("");
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Order Confirmed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your order <strong>${order.reference}</strong> is confirmed.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">${itemsRows}
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-weight:bold;">Total</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;text-align:right;font-weight:bold;color:${ctx.secondaryColor};">${order.currency} ${order.total}</td></tr>
    </table>
  `;
  return render(ctx, bodyHtml, {
    subject: `Order confirmed - ${order.reference}`,
    textLines: [`Order ${order.reference} confirmed. Total: ${order.currency} ${order.total}`],
  });
};

const orderAccepted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Order Accepted</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>${restaurant.name}</strong> has accepted your order <strong>${order.reference}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Order accepted - ${order.reference}`,
    textLines: [`Order ${order.reference} accepted by ${restaurant.name}.`],
  });
};

const orderPreparing = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your Food is Being Prepared</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your order <strong>${order.reference}</strong> is being prepared.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Preparing your order - ${order.reference}`,
    textLines: [`Order ${order.reference} is being prepared.`],
  });
};

const orderOutForDelivery = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, driver } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Out for Delivery</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your order <strong>${order.reference}</strong> is on the way.</p>
    ${driver ? `<p><strong>Driver:</strong> ${driver.firstName} ${driver.lastName} - ${driver.phone}</p>` : ""}
    <p>Track live in the app.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Out for delivery - ${order.reference}`,
    textLines: [`Order ${order.reference} out for delivery.`],
  });
};

const orderDelivered = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Delivered</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your order <strong>${order.reference}</strong> has been delivered. Enjoy your meal!</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Order delivered - ${order.reference}`,
    textLines: [`Order ${order.reference} delivered.`],
  });
};

const orderCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Order Cancelled</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your order <strong>${order.reference}</strong> has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
    <p>Any refund due will be processed within 3-5 business days.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Order cancelled - ${order.reference}`,
    textLines: [`Order ${order.reference} cancelled.`],
  });
};

const deliveryReceipt = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Delivery Receipt</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your receipt for order <strong>${order.reference}</strong>.</p>
    <p style="font-size:20px;font-weight:bold;color:${ctx.secondaryColor};margin-top:16px;">${order.currency} ${order.total}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Receipt for ${order.reference}`,
    textLines: [`Receipt: ${order.currency} ${order.total}`],
  });
};

const dineInBookingConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Table Booking Confirmed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your table at <strong>${restaurant.name}</strong> is confirmed.</p>
    <p><strong>Reference:</strong> ${booking.reference}</p>
    <p><strong>Date:</strong> ${new Date(booking.scheduledAt).toDateString()}</p>
    <p><strong>Party size:</strong> ${booking.partySize}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Table confirmed at ${restaurant.name}`,
    textLines: [`Table confirmed at ${restaurant.name}.`],
  });
};

const dineInReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your Table is in 2 Hours</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Reminder: Your table at <strong>${restaurant.name}</strong> is in 2 hours.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Reminder: Table at ${restaurant.name}`,
    textLines: [`Reminder: Table at ${restaurant.name}.`],
  });
};

const dineInAccepted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Booking Accepted</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>${restaurant.name}</strong> has accepted your booking <strong>${booking.reference}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Booking accepted - ${booking.reference}`,
    textLines: [`Booking ${booking.reference} accepted.`],
  });
};

const dineInCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Booking Cancelled</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your booking <strong>${booking.reference}</strong> has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Booking cancelled - ${booking.reference}`,
    textLines: [`Booking ${booking.reference} cancelled.`],
  });
};

const pickupReady = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your Order is Ready</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your pickup order at <strong>${restaurant.name}</strong> is ready.</p>
    <p><strong>Reference:</strong> ${booking.reference}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Ready for pickup - ${booking.reference}`,
    textLines: [`Order ready for pickup at ${restaurant.name}.`],
  });
};

const pickupCompleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Pickup Completed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Thank you for picking up from <strong>${restaurant.name}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Thanks for your pickup`,
    textLines: [`Pickup completed at ${restaurant.name}.`],
  });
};

const tripBookingConfirmation = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Trip Confirmed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your trip <strong>${trip.reference}</strong> is confirmed.</p>
    <p><strong>Pickup:</strong> ${trip.pickup.address}</p>
    <p><strong>Drop-off:</strong> ${trip.dropoff.address}</p>
    <p><strong>Date:</strong> ${new Date(trip.scheduledAt).toDateString()}</p>
    <p><strong>Fare:</strong> ${trip.currency} ${trip.fare}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Trip confirmed - ${trip.reference}`,
    textLines: [`Trip ${trip.reference} confirmed.`],
  });
};

const driverAssigned = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip, driver, vehicle } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Driver Assigned</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your driver is <strong>${driver.firstName} ${driver.lastName}</strong>.</p>
    <p><strong>Phone:</strong> ${driver.phone}</p>
    <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} - ${vehicle.plateNumber}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Driver assigned - ${trip.reference}`,
    textLines: [`Driver ${driver.firstName} ${driver.lastName} assigned.`],
  });
};

const driverArrivingSoon = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { driver } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Driver Arriving Soon</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your driver <strong>${driver.firstName}</strong> is arriving soon.</p>
    <p>Phone: ${driver.phone}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Driver arriving soon`,
    textLines: [`Driver arriving soon.`],
  });
};

const tripStarted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Trip Started</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your trip <strong>${trip.reference}</strong> has started. Safe travels!</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Trip started - ${trip.reference}`,
    textLines: [`Trip ${trip.reference} started.`],
  });
};

const tripCompleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Trip Completed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your trip <strong>${trip.reference}</strong> is complete.</p>
    <p><strong>Total:</strong> ${trip.currency} ${trip.fare}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Trip completed - ${trip.reference}`,
    textLines: [`Trip ${trip.reference} completed. Total: ${trip.currency} ${trip.fare}`],
  });
};

const tripCancelled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Trip Cancelled</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your trip <strong>${trip.reference}</strong> has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Trip cancelled - ${trip.reference}`,
    textLines: [`Trip ${trip.reference} cancelled.`],
  });
};

const paymentReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payment Received</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>We received your payment of <strong>${payment.currency} ${payment.amount}</strong>.</p>
    <p><strong>Reference:</strong> ${payment.reference}</p>
    <p><strong>Method:</strong> ${payment.method}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payment received - ${payment.reference}`,
    textLines: [`Payment of ${payment.currency} ${payment.amount} received.`],
  });
};

const paymentFailed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payment Failed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your payment of <strong>${payment.currency} ${payment.amount}</strong> failed.</p>
    <p><strong>Reason:</strong> ${reason || "Unknown"}</p>
    <p>Please try again or contact ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payment failed - ${payment.reference}`,
    textLines: [`Payment failed. Reason: ${reason}`],
  });
};

const walletToppedUp = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, balance } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Wallet Topped Up</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your wallet was topped up by <strong>${amount}</strong>.</p>
    <p><strong>New balance:</strong> ${balance}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Wallet topped up`,
    textLines: [`Wallet topped up by ${amount}. Balance: ${balance}`],
  });
};

const refundIssued = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, reference } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Refund Issued</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A refund of <strong>${amount}</strong> has been issued for <strong>${reference}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Refund issued - ${reference}`,
    textLines: [`Refund of ${amount} issued for ${reference}.`],
  });
};

const payoutToWallet = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { amount, balance } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payout Received</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A payout of <strong>${amount}</strong> has been credited to your wallet.</p>
    <p><strong>New balance:</strong> ${balance}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payout received`,
    textLines: [`Payout of ${amount} received. Balance: ${balance}`],
  });
};

const partnerApplicationReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Application Received</h2>
    <p>Hi ${name},</p>
    <p>We've received your application. Our team will review it within 24-48 hours.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Application received`,
    textLines: [`We received your application.`],
  });
};

const partnerApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">You're Approved</h2>
    <p>Hi ${name},</p>
    <p>Your partner account has been approved. You can now start receiving orders.</p>
    <p style="margin-top:16px;">
      <a href="${ctx.websiteUrl}" style="background-color:${ctx.secondaryColor};color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Go to Dashboard</a>
    </p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your partner account is approved`,
    textLines: [`Your partner account is approved.`],
  });
};

const partnerRejected = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Application Not Approved</h2>
    <p>Hi ${name},</p>
    <p>Unfortunately, your application was not approved.</p>
    <p><strong>Reason:</strong> ${payload.reason || "Not provided"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Application status update`,
    textLines: [`Application not approved.`],
  });
};

const partnerSuspended = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Account Suspended</h2>
    <p>Hi ${name},</p>
    <p>Your account has been suspended.</p>
    <p><strong>Reason:</strong> ${payload.reason}</p>
    <p>Contact ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your account has been suspended`,
    textLines: [`Account suspended.`],
  });
};

const partnerReactivated = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const name = recipient.firstName || recipient.name;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Account Reactivated</h2>
    <p>Hi ${name},</p>
    <p>Your account has been reactivated.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Account reactivated`,
    textLines: [`Account reactivated.`],
  });
};

const vehicleApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { vehicle } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Vehicle Approved</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your vehicle <strong>${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})</strong> has been approved.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Vehicle approved`,
    textLines: [`Vehicle ${vehicle.plateNumber} approved.`],
  });
};

const vehicleRejected = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { vehicle, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Vehicle Not Approved</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your vehicle <strong>${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})</strong> was not approved.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Vehicle not approved`,
    textLines: [`Vehicle not approved.`],
  });
};

const propertyApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Property Approved</h2>
    <p>Hi ${recipient.name},</p>
    <p>Your property <strong>${property.name}</strong> has been approved.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Property approved`,
    textLines: [`Property ${property.name} approved.`],
  });
};

const propertyRejected = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Property Not Approved</h2>
    <p>Hi ${recipient.name},</p>
    <p>Your property <strong>${property.name}</strong> was not approved.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Property not approved`,
    textLines: [`Property not approved.`],
  });
};

const roomApproved = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { room } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Room Approved</h2>
    <p>Hi ${recipient.name},</p>
    <p>Your room <strong>${room.name}</strong> has been approved and is now live.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Room approved`,
    textLines: [`Room ${room.name} approved.`],
  });
};

const newOrderReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Order</h2>
    <p>Hi ${recipient.name},</p>
    <p>You have a new order <strong>${order.reference}</strong>.</p>
    <p><strong>Total:</strong> ${order.currency} ${order.total}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New order - ${order.reference}`,
    textLines: [`New order ${order.reference}.`],
  });
};

const newBroadcastReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { request } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Broadcast Request</h2>
    <p>Hi ${recipient.name},</p>
    <p>Food: <strong>${request.foodType}</strong></p>
    <p>Preparation: ${request.preparation}</p>
    <p>Time needed: ${new Date(request.timeNeeded).toLocaleString()}</p>
    <p>Budget: ${request.currency} ${request.budget}</p>
    <p style="margin-top:16px;">
      <a href="${ctx.websiteUrl}" style="background-color:${ctx.secondaryColor};color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Request</a>
    </p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New broadcast request`,
    textLines: [`New broadcast: ${request.foodType}`],
  });
};

const orderCancelledByCustomer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { order, reason } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Order Cancelled by Customer</h2>
    <p>Hi ${recipient.name},</p>
    <p>Order <strong>${order.reference}</strong> was cancelled by the customer.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Order cancelled - ${order.reference}`,
    textLines: [`Order ${order.reference} cancelled by customer.`],
  });
};

const newTripRequest = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { trip } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Trip Request</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>Pickup:</strong> ${trip.pickup.address}</p>
    <p><strong>Drop-off:</strong> ${trip.dropoff.address}</p>
    <p><strong>Fare:</strong> ${trip.currency} ${trip.fare}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New trip request`,
    textLines: [`New trip request.`],
  });
};

const newBookingReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { booking, property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Booking</h2>
    <p>Hi ${recipient.name},</p>
    <p>New booking at <strong>${property.name}</strong>.</p>
    <p><strong>Reference:</strong> ${booking.reference}</p>
    <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toDateString()}</p>
    <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toDateString()}</p>
    <p><strong>Total:</strong> ${booking.currency} ${booking.total}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New booking - ${booking.reference}`,
    textLines: [`New booking ${booking.reference}.`],
  });
};

const guestCheckedIn = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { guest, booking } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Guest Checked In</h2>
    <p>Hi ${recipient.name},</p>
    <p>${guest.firstName} ${guest.lastName} has checked in for booking ${booking.reference}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Guest checked in`,
    textLines: [`Guest checked in for ${booking.reference}.`],
  });
};

const guestCheckedOut = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { guest, booking } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Guest Checked Out</h2>
    <p>Hi ${recipient.name},</p>
    <p>${guest.firstName} ${guest.lastName} has checked out from booking ${booking.reference}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Guest checked out`,
    textLines: [`Guest checked out from ${booking.reference}.`],
  });
};

const paymentReceivedPartner = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment } = payload;
  const name = recipient.name || recipient.firstName;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payment Received</h2>
    <p>Hi ${name},</p>
    <p>Payment of <strong>${payment.currency} ${payment.amount}</strong> received for <strong>${payment.reference}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payment received`,
    textLines: [`Payment of ${payment.currency} ${payment.amount} received.`],
  });
};

const payoutProcessed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const name = recipient.name || recipient.firstName;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payout Processed</h2>
    <p>Hi ${name},</p>
    <p>Your payout of <strong>${payout.currency} ${payout.amount}</strong> has been processed.</p>
    <p><strong>Method:</strong> ${payout.method}</p>
    <p><strong>Reference:</strong> ${payout.reference}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payout processed`,
    textLines: [`Payout of ${payout.currency} ${payout.amount} processed.`],
  });
};

const payoutFailed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout, reason } = payload;
  const name = recipient.name || recipient.firstName;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payout Failed</h2>
    <p>Hi ${name},</p>
    <p>Your payout of <strong>${payout.currency} ${payout.amount}</strong> failed.</p>
    <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
    <p>Contact ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payout failed`,
    textLines: [`Payout failed.`],
  });
};

const weeklyEarningsSummary = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { summary } = payload;
  const name = recipient.name || recipient.firstName;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Weekly Earnings Summary</h2>
    <p>Hi ${name},</p>
    <p>Here is your summary for the week.</p>
    <p><strong>Orders:</strong> ${summary.orders}</p>
    <p><strong>Gross Earnings:</strong> ${summary.currency} ${summary.gross}</p>
    <p><strong>Commission:</strong> ${summary.currency} ${summary.commission}</p>
    <p><strong>Net Earnings:</strong> <span style="color:${ctx.secondaryColor};font-weight:bold;">${summary.currency} ${summary.net}</span></p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Weekly earnings summary`,
    textLines: [`Weekly earnings: ${summary.currency} ${summary.net}`],
  });
};

const reviewReceived = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { review } = payload;
  const name = recipient.name || recipient.firstName;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Review Received</h2>
    <p>Hi ${name},</p>
    <p>You received a <strong>${review.rating}-star</strong> review.</p>
    <p style="background-color:#F5F5F5;padding:12px;border-radius:6px;font-style:italic;">"${review.comment}"</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New review received`,
    textLines: [`New ${review.rating}-star review received.`],
  });
};

const adminNewPartnerApplication = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { partnerType, partner } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Partner Application</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A new <strong>${partnerType}</strong> partner application has been submitted.</p>
    <p><strong>Name:</strong> ${partner.name || `${partner.firstName || ""} ${partner.lastName || ""}`.trim()}</p>
    <p><strong>Email:</strong> ${partner.email}</p>
    <p><strong>Phone:</strong> ${partner.phone}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New ${partnerType} partner application`,
    textLines: [`New ${partnerType} application from ${partner.email}`],
  });
};

const adminNewDispute = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { dispute } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Dispute</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A new dispute <strong>${dispute.reference}</strong> has been raised.</p>
    <p><strong>Category:</strong> ${dispute.category}</p>
    <p><strong>Subject:</strong> ${dispute.subject}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New dispute - ${dispute.reference}`,
    textLines: [`New dispute ${dispute.reference}.`],
  });
};

const adminNewContact = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { contact } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Contact Message</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>From: ${contact.name} (${contact.email})</p>
    <p><strong>Subject:</strong> ${contact.subject}</p>
    <p>${contact.message}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New contact message`,
    textLines: [`New contact from ${contact.email}`],
  });
};

const adminPayoutApprovalRequired = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Payout Approval Required</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A payout of <strong>${payout.currency} ${payout.amount}</strong> is awaiting your approval.</p>
    <p><strong>Reference:</strong> ${payout.reference}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Payout approval required`,
    textLines: [`Payout approval required: ${payout.reference}`],
  });
};

const adminManualPayoutRequest = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Manual Payout Request</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A manual payout request of <strong>${payout.currency} ${payout.amount}</strong> has been submitted.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Manual payout request`,
    textLines: [`Manual payout request: ${payout.reference}`],
  });
};

const adminCommissionLedgerAlert = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { ledger } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Commission Ledger Alert</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Partner <strong>${ledger.partnerName}</strong> has outstanding commission of <strong>${ledger.currency} ${ledger.amount}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Commission ledger alert`,
    textLines: [`Commission owed: ${ledger.currency} ${ledger.amount}`],
  });
};

const adminFailedPayment = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payment } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Failed Payment Alert</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Payment <strong>${payment.reference}</strong> failed.</p>
    <p><strong>Reason:</strong> ${payment.failureReason || "Unknown"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Failed payment alert`,
    textLines: [`Payment ${payment.reference} failed.`],
  });
};

const adminFailedPayout = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { payout } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Failed Payout Alert</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Payout <strong>${payout.reference}</strong> failed.</p>
    <p><strong>Reason:</strong> ${payout.failureReason || "Unknown"}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Failed payout alert`,
    textLines: [`Payout ${payout.reference} failed.`],
  });
};

const adminBackupCompleted = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { backup } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Backup Completed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Backup <strong>${backup.filename}</strong> completed successfully.</p>
    <p><strong>Size:</strong> ${backup.size} bytes</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Backup completed`,
    textLines: [`Backup ${backup.filename} completed.`],
  });
};

const adminBackupFailed = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Backup Failed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>The scheduled backup failed.</p>
    <p><strong>Reason:</strong> ${payload.reason}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Backup failed`,
    textLines: [`Backup failed: ${payload.reason}`],
  });
};

const adminRevenueSummary = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { summary, period } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">${period} Revenue Summary</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>Total Revenue:</strong> ${summary.currency} ${summary.total}</p>
    <p><strong>Food Commission:</strong> ${summary.currency} ${summary.food}</p>
    <p><strong>Transport Commission:</strong> ${summary.currency} ${summary.transport}</p>
    <p><strong>Accommodation Commission:</strong> ${summary.currency} ${summary.accommodation}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `${period} revenue summary`,
    textLines: [`${period} revenue: ${summary.currency} ${summary.total}`],
  });
};

const adminSystemHealthAlert = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { alert } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">System Health Alert</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>Alert:</strong> ${alert.title}</p>
    <p>${alert.message}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `System alert - ${alert.title}`,
    textLines: [`System alert: ${alert.title}`],
  });
};

const adminInvited = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const inviterName = payload.inviter?.firstName
    ? `${payload.inviter.firstName}${payload.inviter.lastName ? " " + payload.inviter.lastName : ""}`
    : "The Digital Safaris team";
  const tempPassword = payload.tempPassword || "—";
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">You're Invited</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>${inviterName} has invited you as an admin on ${ctx.appName}.</p>
    <p><strong>Email:</strong> ${recipient.email}</p>
    <p><strong>Temporary password:</strong> ${tempPassword}</p>
    <p>Change your password after first login.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `You've been invited as admin`,
    textLines: [`Admin invitation. Temp password: ${tempPassword}`],
  });
};

const adminAccountCreated = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Admin Account Created</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your admin account has been created.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Admin account created`,
    textLines: [`Your admin account has been created.`],
  });
};

const adminRoleChanged = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { oldRole, newRole } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Role Changed</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your role changed from <strong>${oldRole}</strong> to <strong>${newRole}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your role was changed`,
    textLines: [`Role changed from ${oldRole} to ${newRole}.`],
  });
};

const adminAccountSuspended = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Admin Account Suspended</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your admin account has been suspended.</p>
    <p><strong>Reason:</strong> ${payload.reason}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Admin account suspended`,
    textLines: [`Admin account suspended.`],
  });
};

const welcomeSeriesDay0 = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Welcome to ${ctx.appName}</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Start exploring accommodations, restaurants, and transport in one app.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Welcome to ${ctx.appName}`,
    textLines: [`Welcome to ${ctx.appName}.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const welcomeSeriesDay3 = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Have You Tried the Concierge?</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Ask our AI concierge anything — from restaurant recommendations to local tips.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Try the Digital Safaris concierge`,
    textLines: [`Try the AI concierge.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const welcomeSeriesDay7 = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your First Booking Awaits</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Book your first stay and get exclusive member rates.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Book your first stay`,
    textLines: [`Book your first stay.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const promotionalOffer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { offer } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">${offer.title}</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>${offer.message}</p>
    ${offer.code ? `<p style="font-size:20px;font-weight:bold;color:${ctx.secondaryColor};">Use code: ${offer.code}</p>` : ""}
  `;
  return render(ctx, bodyHtml, {
    subject: offer.title,
    textLines: [`${offer.title}: ${offer.message}`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const newRestaurantInTown = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Restaurant in ${recipient.town}</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>${restaurant.name}</strong> just joined Digital Safaris.</p>
    <p>${restaurant.description || ""}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New restaurant in ${recipient.town}`,
    textLines: [`New restaurant: ${restaurant.name}`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const newAccommodationInTown = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { accommodation } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">New Stay in ${recipient.town}</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>${accommodation.name}</strong> just joined Digital Safaris.</p>
    <p>${accommodation.description || ""}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `New stay in ${recipient.town}`,
    textLines: [`New accommodation: ${accommodation.name}`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const seasonalDeals = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { deals } = payload;
  const dealsHtml = deals
    .map((d) => `<li style="margin-bottom:8px;"><strong>${d.title}</strong> - ${d.description}</li>`)
    .join("");
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Seasonal Deals</h2>
    <p>Hi ${recipient.firstName},</p>
    <ul style="padding-left:20px;">${dealsHtml}</ul>
  `;
  return render(ctx, bodyHtml, {
    subject: `Seasonal deals for you`,
    textLines: [`Seasonal deals available.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const abandonedBookingReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { property } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">You Left Something Behind</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You were looking at <strong>${property.name}</strong>. Complete your booking before it's gone.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Complete your booking`,
    textLines: [`Complete your booking at ${property.name}.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const abandonedOrderReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { restaurant } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Still Hungry?</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You left items in your cart from <strong>${restaurant.name}</strong>.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Complete your order`,
    textLines: [`Complete your order at ${restaurant.name}.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const loyaltyMilestone = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { milestone } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Milestone Reached</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You've reached <strong>${milestone.title}</strong>! ${milestone.reward || ""}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `You reached ${milestone.title}`,
    textLines: [`Milestone reached: ${milestone.title}`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const referralRewardEarned = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { reward } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Referral Reward Earned</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You earned <strong>${reward.amount}</strong> for referring ${reward.friendName}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `You earned a reward`,
    textLines: [`Referral reward: ${reward.amount}`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const referralJoined = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { friend } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your Friend Joined</h2>
    <p>Hi ${recipient.firstName},</p>
    <p><strong>${friend.firstName}</strong> joined Digital Safaris using your referral code.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `${friend.firstName} joined using your code`,
    textLines: [`${friend.firstName} joined using your code.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const birthdayOffer = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { offer } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Happy Birthday, ${recipient.firstName}!</h2>
    <p>${offer.message}</p>
    ${offer.code ? `<p style="font-size:20px;font-weight:bold;color:${ctx.secondaryColor};">Use code: ${offer.code}</p>` : ""}
  `;
  return render(ctx, bodyHtml, {
    subject: `Happy Birthday, ${recipient.firstName}!`,
    textLines: [`Happy Birthday! ${offer.message}`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const reEngagement = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">We Miss You, ${recipient.firstName}</h2>
    <p>It's been a while. Come back and see what's new on Digital Safaris.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `We miss you`,
    textLines: [`We miss you at Digital Safaris.`],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const newsletter = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { issue } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">${issue.title}</h2>
    <p>Hi ${recipient.firstName},</p>
    ${issue.content}
  `;
  return render(ctx, bodyHtml, {
    subject: issue.title,
    textLines: [issue.title],
    unsubscribeUrl: `${ctx.websiteUrl}/unsubscribe`,
  });
};

const twoFactorCode = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Two-Factor Code</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your 2FA code is:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:${ctx.secondaryColor};margin:24px 0;text-align:center;">${payload.code}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your 2FA code`,
    textLines: [`Your 2FA code is ${payload.code}.`],
  });
};

const sessionRevoked = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Session Revoked</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>A session on <strong>${payload.device}</strong> was revoked.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Session revoked`,
    textLines: [`Session on ${payload.device} was revoked.`],
  });
};

const suspiciousActivity = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Suspicious Activity Detected</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>${payload.activity}</p>
    <p>If this wasn't you, contact ${ctx.supportEmail}.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Suspicious activity on your account`,
    textLines: [`Suspicious activity: ${payload.activity}`],
  });
};

const legalPolicyUpdate = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const { policy } = payload;
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Policy Update: ${policy.title}</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>We've updated our ${policy.title}. Please review.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Policy update: ${policy.title}`,
    textLines: [`Policy updated: ${policy.title}`],
  });
};

const termsAcceptanceReminder = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Please Accept Our Updated Terms</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Please accept the updated Terms of Service to continue using Digital Safaris.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Accept updated terms`,
    textLines: [`Please accept updated terms.`],
  });
};

const dataExportReady = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Your Data Export is Ready</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Download link: <a href="${payload.downloadUrl}" style="color:${ctx.secondaryColor};">Download</a></p>
    <p>Link expires in 24 hours.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Your data export is ready`,
    textLines: [`Download your data: ${payload.downloadUrl}`],
  });
};

const accountDeletionScheduled = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Account Deletion Scheduled</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Your account is scheduled for deletion on <strong>${payload.date}</strong>.</p>
    <p>Log in before then to cancel.</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Account deletion scheduled`,
    textLines: [`Account deletion scheduled for ${payload.date}.`],
  });
};

const changeContactOTP = (recipient, payload = {}) => {
  const ctx = resolveContext(payload);
  const bodyHtml = `
    <h2 style="margin:0 0 16px 0;color:${ctx.primaryColor};">Confirm Your ${payload.type} Change</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>Use this code to confirm your ${payload.type} change:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:${ctx.secondaryColor};margin:24px 0;text-align:center;">${payload.otp}</p>
  `;
  return render(ctx, bodyHtml, {
    subject: `Confirm your ${payload.type} change - ${payload.otp}`,
    textLines: [`Your ${payload.type} change code: ${payload.otp}`],
  });
};

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