import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Backup from "../models/admin/Backup.js";
import SystemSetting from "../models/admin/SystemSetting.js";
import Admin from "../models/admin/Admin.js";
import * as emailService from "./emailService.js";
import logger from "../utils/logger.js";

const backupDir = path.resolve(process.cwd(), "backups");

const ensureDir = () => {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
};

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const getBackupSettings = async () => {
  const doc = await SystemSetting.findOne({ key: "backup" });
  return (
    doc?.value || {
      enabled: false,
      frequency: "daily",
      time: "02:00",
      retentionDays: 30,
      notifyEmail: true,
    }
  );
};

const dumpCollection = async (collectionName) => {
  const collection = mongoose.connection.collection(collectionName);
  return collection.find({}).toArray();
};

const buildDump = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const dump = {
    meta: {
      app: "Digital Safaris",
      createdAt: new Date().toISOString(),
      database: mongoose.connection.name,
      collections: collections.length,
    },
    data: {},
  };

  for (const col of collections) {
    const name = col.name;
    if (name.startsWith("system.")) continue;
    dump.data[name] = await dumpCollection(name);
  }

  return dump;
};

const notifyAdmins = async (type, payload) => {
  const settings = await getBackupSettings();
  if (!settings.notifyEmail) return { sent: 0, failures: [] };

  const admins = await Admin.find({ status: "active", isDeleted: false }).select(
    "firstName lastName email"
  );

  const failures = [];
  let sent = 0;

  for (const admin of admins) {
    try {
      if (type === "completed") {
        await emailService.adminBackupCompleted(admin, { backup: payload.backup });
      } else {
        await emailService.adminBackupFailed(admin, { reason: payload.reason });
      }
      sent++;
    } catch (err) {
      failures.push({ email: admin.email, error: err.message });
      logger.error("Backup notification failed", {
        admin: admin.email,
        error: err.message,
      });
    }
  }

  return { sent, failures };
};

const createBackup = async ({ type = "manual", adminId = null } = {}) => {
  ensureDir();
  const filename = `digitalsafaris-${timestamp()}.json`;
  const filepath = path.join(backupDir, filename);

  const record = await Backup.create({
    filename,
    size: 0,
    type,
    status: "processing",
    path: filepath,
    createdBy: adminId,
  });

  try {
    const dump = await buildDump();
    const json = JSON.stringify(dump, null, 2);
    fs.writeFileSync(filepath, json, "utf8");

    const stat = fs.statSync(filepath);
    record.size = stat.size;
    record.status = "success";
    await record.save();

    logger.info(`Backup created: ${filename}`);

    await notifyAdmins("completed", { backup: record });

    return { success: true, backup: record };
  } catch (err) {
    record.status = "failed";
    record.failureReason = err.message;
    await record.save();

    logger.error("Backup failed", { error: err.message });
    await notifyAdmins("failed", { reason: err.message });

    return { success: false, error: err.message };
  }
};

const restoreBackup = async (filename, adminId = null) => {
  const filepath = path.join(backupDir, filename);
  if (!fs.existsSync(filepath)) {
    return { success: false, error: "Backup file not found" };
  }

  try {
    const raw = fs.readFileSync(filepath, "utf8");
    const dump = JSON.parse(raw);

    if (!dump.data || typeof dump.data !== "object") {
      throw new Error("Invalid backup structure");
    }

    for (const [colName, docs] of Object.entries(dump.data)) {
      if (!Array.isArray(docs)) continue;
      const collection = mongoose.connection.collection(colName);
      await collection.deleteMany({});
      if (docs.length > 0) await collection.insertMany(docs);
    }

    await Backup.findOneAndUpdate(
      { filename },
      { restoredAt: new Date(), restoredBy: adminId }
    );

    logger.info(`Backup restored: ${filename}`);
    return { success: true };
  } catch (err) {
    logger.error("Restore failed", { error: err.message });
    return { success: false, error: err.message };
  }
};

const uploadBackup = async ({ filename, content, adminId = null }) => {
  ensureDir();
  const safeName = `uploaded-${timestamp()}-${filename}`;
  const filepath = path.join(backupDir, safeName);

  fs.writeFileSync(filepath, content);

  const stat = fs.statSync(filepath);
  const record = await Backup.create({
    filename: safeName,
    size: stat.size,
    type: "upload",
    status: "success",
    path: filepath,
    createdBy: adminId,
  });

  return { success: true, backup: record };
};

const downloadBackup = async (filename) => {
  const filepath = path.join(backupDir, filename);
  if (!fs.existsSync(filepath)) {
    return { success: false, error: "Backup file not found" };
  }
  return { success: true, path: filepath };
};

const emailBackup = async (filename) => {
  const filepath = path.join(backupDir, filename);
  if (!fs.existsSync(filepath)) {
    return { success: false, error: "Backup file not found" };
  }

  const admins = await Admin.find({ status: "active", isDeleted: false }).select(
    "firstName lastName email"
  );

  if (admins.length === 0) {
    return { success: false, error: "No active admins to notify" };
  }

  const size = fs.statSync(filepath).size;
  const failures = [];
  let sent = 0;

  for (const admin of admins) {
    try {
      await emailService.adminBackupCompleted(admin, {
        backup: { filename, size },
      });
      sent++;
    } catch (err) {
      failures.push({ email: admin.email, error: err.message });
      logger.error("Backup email failed", {
        admin: admin.email,
        error: err.message,
      });
    }
  }

  if (sent === 0) {
    return {
      success: false,
      error: "All admin notifications failed",
      failures,
    };
  }

  return { success: true, sent, failures };
};

const deleteBackup = async (filename) => {
  const filepath = path.join(backupDir, filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  await Backup.findOneAndDelete({ filename });
  return { success: true };
};

const listBackups = async () => Backup.find().sort({ createdAt: -1 });

const cleanupOldBackups = async () => {
  const settings = await getBackupSettings();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.retentionDays);

  const old = await Backup.find({ createdAt: { $lt: cutoff } });
  for (const b of old) {
    const filepath = path.join(backupDir, b.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await Backup.deleteOne({ _id: b._id });
  }
};

const updateBackupSettings = async (value, adminId) => {
  const doc = await SystemSetting.findOneAndUpdate(
    { key: "backup" },
    { key: "backup", value, group: "backup", updatedBy: adminId },
    { upsert: true, new: true }
  );
  return doc.value;
};

export {
  createBackup,
  restoreBackup,
  uploadBackup,
  downloadBackup,
  emailBackup,
  deleteBackup,
  listBackups,
  cleanupOldBackups,
  updateBackupSettings,
  getBackupSettings,
};