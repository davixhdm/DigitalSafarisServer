import FoodOrder from "../models/rest/FoodOrder.js";
import * as socketService from "../services/socketService.js";
import logger from "../utils/logger.js";

const TIMEOUT_MS = 15 * 60 * 1000;

const runOrderTimeoutJob = async () => {
  const cutoff = new Date(Date.now() - TIMEOUT_MS);

  const stuck = await FoodOrder.find({
    status: "pending",
    createdAt: { $lt: cutoff },
  });

  for (const order of stuck) {
    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = "admin";
    order.cancellationReason = "Auto-cancelled: restaurant did not respond in time";
    await order.save();

    socketService.emitToCustomer(order.customer.toString(), "order:cancelled", {
      reference: order.reference,
      reason: order.cancellationReason,
    });
  }

  logger.info(`Order timeout job completed. ${stuck.length} cancelled.`);
};

export { runOrderTimeoutJob };