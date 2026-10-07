import BroadcastRequest from "../models/rest/BroadcastRequest.js";
import * as socketService from "../services/socketService.js";
import logger from "../utils/logger.js";

const runBroadcastExpiryJob = async () => {
  const now = new Date();

  const expired = await BroadcastRequest.find({
    status: "broadcasting",
    broadcastExpiresAt: { $lt: now },
  });

  for (const req of expired) {
    req.status = "expired";
    await req.save();

    socketService.cancelBroadcast(
      req.reference,
      req.targetedRestaurants.map((id) => id.toString())
    );

    socketService.emitToCustomer(req.customer.toString(), "broadcast:expired", {
      reference: req.reference,
    });
  }

  logger.info(`Broadcast expiry job completed. ${expired.length} expired.`);
};

export { runBroadcastExpiryJob };