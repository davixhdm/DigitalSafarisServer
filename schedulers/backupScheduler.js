import { getBackupSettings, createBackup, cleanupOldBackups } from "../services/backupService.js";
import logger from "../utils/logger.js";

const matchesFrequency = (frequency, now) => {
  const day = now.getDay();
  const date = now.getDate();

  if (frequency === "daily") return true;
  if (frequency === "weekly") return day === 0;
  if (frequency === "monthly") return date === 1;
  return false;
};

const matchesTime = (time, now) => {
  const [hh, mm] = time.split(":").map(Number);
  return now.getHours() === hh && now.getMinutes() === mm;
};

const runBackupJob = async () => {
  const settings = await getBackupSettings();
  if (!settings.enabled) return;

  const now = new Date();
  if (!matchesFrequency(settings.frequency, now)) return;
  if (!matchesTime(settings.time, now)) return;

  await createBackup({ type: "auto" });
  await cleanupOldBackups();

  logger.info("Auto backup job completed");
};

export { runBackupJob };