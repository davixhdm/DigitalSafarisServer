import Booking from "../models/accom/Booking.js";
import DineInBooking from "../models/rest/DineInBooking.js";
import * as emailService from "../services/emailService.js";
import * as smsService from "../services/smsService.js";
import logger from "../utils/logger.js";

const HOUR = 60 * 60 * 1000;

const withinWindow = (target, from, to) => {
  const t = new Date(target).getTime();
  return t >= from && t <= to;
};

const runBookingReminderJob = async () => {
  const now = Date.now();

  const accommodationBookings = await Booking.find({
    status: "confirmed",
  }).populate("customer partner property");

  for (const b of accommodationBookings) {
    if (!b.customer) continue;
    const checkIn = new Date(b.checkIn).getTime();

    if (withinWindow(checkIn, now + 23 * HOUR, now + 25 * HOUR)) {
      await emailService.bookingReminder24h(b.customer, { booking: b, property: b.property });
      await smsService.bookingReminder24h(b.customer, {
        reference: b.reference,
        property: b.property.name,
      });
    }

    if (withinWindow(checkIn, now + 1 * HOUR, now + 3 * HOUR)) {
      await emailService.bookingReminder2h(b.customer, { booking: b, property: b.property });
      await smsService.bookingReminder2h(b.customer, {
        reference: b.reference,
        property: b.property.name,
      });
    }
  }

  const dineInBookings = await DineInBooking.find({
    status: "accepted",
  }).populate("customer restaurant");

  for (const b of dineInBookings) {
    if (!b.customer) continue;
    const scheduled = new Date(b.scheduledAt).getTime();

    if (withinWindow(scheduled, now + 1 * HOUR, now + 3 * HOUR)) {
      await emailService.dineInReminder(b.customer, { booking: b, restaurant: b.restaurant });
      await smsService.dineInReminder(b.customer, {
        reference: b.reference,
        restaurant: b.restaurant.name,
      });
    }
  }

  logger.info("Booking reminder job completed");
};

export { runBookingReminderJob };