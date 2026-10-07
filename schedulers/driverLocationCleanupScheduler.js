import DriverLocation from "../models/trans/DriverLocation.js";
import logger from "../utils/logger.js";

const STALE_MS = 30 * 60 * 1000;

const runDriverLocationCleanupJob = async () => {
  const cutoff = new Date(Date.now() - STALE_MS);

  const result = await DriverLocation.updateMany(
    { lastPingAt: { $lt: cutoff }, isOnline: true },
    { $set: { isOnline: false, isAvailable: false } }
  );

  logger.info(`Driver location cleanup completed. ${result.modifiedCount} marked offline.`);
};

export { runDriverLocationCleanupJob };