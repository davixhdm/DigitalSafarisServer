import CustomerSession from "../models/customer/CustomerSession.js";
import CustomerOTP from "../models/customer/CustomerOTP.js";
import logger from "../utils/logger.js";

const runStaleSessionCleanupJob = async () => {
  const now = new Date();

  const [sessions, otps] = await Promise.all([
    CustomerSession.deleteMany({ expiresAt: { $lt: now } }),
    CustomerOTP.deleteMany({ expiresAt: { $lt: now } }),
  ]);

  logger.info(
    `Stale session cleanup completed. Sessions: ${sessions.deletedCount}, OTPs: ${otps.deletedCount}.`
  );
};

export { runStaleSessionCleanupJob };