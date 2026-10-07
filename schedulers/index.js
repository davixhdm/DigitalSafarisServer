import cron from "node-cron";
import { runPayoutJob } from "./payoutScheduler.js";
import { runBackupJob } from "./backupScheduler.js";
import { runBookingReminderJob } from "./bookingReminderScheduler.js";
import { runOrderTimeoutJob } from "./orderTimeoutScheduler.js";
import { runBroadcastExpiryJob } from "./broadcastExpiryScheduler.js";
import { runDriverLocationCleanupJob } from "./driverLocationCleanupScheduler.js";
import { runStaleSessionCleanupJob } from "./staleSessionCleanupScheduler.js";
import logger from "../utils/logger.js";

const jobs = [];

const register = (name, expression, handler) => {
  const task = cron.schedule(expression, async () => {
    try {
      await handler();
    } catch (err) {
      logger.error(`Scheduler failed: ${name}`, { error: err.message });
    }
  });
  jobs.push({ name, task });
  logger.info(`Scheduler registered: ${name} (${expression})`);
};

const startSchedulers = () => {
  register("payout", "0 17 * * 5", runPayoutJob);
  register("backup", "* * * * *", runBackupJob);
  register("bookingReminder", "*/15 * * * *", runBookingReminderJob);
  register("orderTimeout", "*/5 * * * *", runOrderTimeoutJob);
  register("broadcastExpiry", "*/1 * * * *", runBroadcastExpiryJob);
  register("driverLocationCleanup", "*/30 * * * *", runDriverLocationCleanupJob);
  register("staleSessionCleanup", "0 * * * *", runStaleSessionCleanupJob);
};

const stopSchedulers = () => {
  for (const j of jobs) j.task.stop();
  logger.info("All schedulers stopped");
};

export { startSchedulers, stopSchedulers };