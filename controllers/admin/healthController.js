import os from "os";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { env } from "../../config/env.js";
import { getRedis } from "../../config/redis.js";
import Backup from "../../models/admin/Backup.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";

const ok = (res, data) =>
  res.status(200).json(new ApiResponse(200, data, "OK"));

const maskHost = (uri) => {
  try {
    const u = new URL(uri);
    return u.host;
  } catch {
    return "unknown";
  }
};

const maskEmail = (email) => {
  if (!email) return null;
  const [user, domain] = String(email).split("@");
  if (!domain) return "[redacted]";
  return `${user.slice(0, 2)}***@${domain}`;
};

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!d && !h) parts.push(`${s}s`);
  return parts.join(" ");
};

const collectServer = () => {
  const mem = process.memoryUsage();
  return {
    status: "up",
    version: process.env.npm_package_version || "1.0.0",
    node: process.version,
    platform: `${os.type()} ${os.release()}`,
    hostname: os.hostname(),
    url: env.apiUrl || null,
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    cpuCores: os.cpus().length,
    memoryRssMb: Math.round(mem.rss / 1024 / 1024),
    memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    pid: process.pid,
  };
};

const collectDatabase = async () => {
  const db = mongoose.connection.db;
  const stateMap = ["disconnected", "connected", "connecting", "disconnecting"];
  const status = stateMap[mongoose.connection.readyState] || "unknown";

  let collections = 0;
  let documents = 0;
  let dbName = null;

  if (db && mongoose.connection.readyState === 1) {
    try {
      const cols = await db.listCollections().toArray();
      collections = cols.length;
      dbName = db.databaseName;
      for (const c of cols) {
        try {
          documents += await db.collection(c.name).estimatedDocumentCount();
        } catch {}
      }
    } catch {}
  }

  return {
    status,
    type: "MongoDB",
    host: maskHost(env.mongodbUri),
    database: dbName,
    collections,
    documents,
  };
};

const collectRedis = async () => {
  if (!env.redisEnabled) {
    return {
      status: "disabled",
      enabled: false,
      host: env.redisUrl,
      message: "Redis disabled via REDIS_ENABLED=false",
    };
  }

  const redis = getRedis();
  if (!redis) {
    return { status: "down", enabled: true, host: env.redisUrl };
  }

  try {
    const pong = await redis.ping();
    const info = await redis.info("memory").catch(() => "");
    const used = info.match(/used_memory_human:([^\r\n]+)/);

    return {
      status: pong === "PONG" ? "up" : "down",
      enabled: true,
      host: env.redisUrl,
      memoryUsed: used ? used[1].trim() : null,
    };
  } catch (e) {
    return { status: "down", enabled: true, host: env.redisUrl, error: e.message };
  }
};

const collectEmail = () => {
  const enabled = Boolean(env.hdmApiKey && env.hdmFromEmail);
  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    provider: env.emailProvider === "brevo" ? "Brevo" : "HDM Bridge",
    from: env.hdmFromEmail || env.brevoSenderEmail || null,
    fromMasked: maskEmail(env.hdmFromEmail || env.brevoSenderEmail),
    sender: env.hdmFromName || env.brevoSenderName || null,
  };
};

const collectSms = () => {
  const enabled =
    env.smsEnabled === true &&
    Boolean(env.hdmApiKey || env.africasTalkingApiKey);
  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    provider: env.smsProvider === "africastalking" ? "Africa's Talking" : "HDM Bridge",
    sender: env.hdmSmsSender || env.africasTalkingSenderId || null,
  };
};

const collectAi = () => {
  const enabled = Boolean(env.hdmAiApiKey && env.hdmAiApiUrl);
  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    provider: "HDM AI",
    baseUrl: env.hdmAiApiUrl || null,
    model: env.hdmAiModel || null,
  };
};

const collectMpesa = () => {
  const enabled = Boolean(
    env.mpesaConsumerKey &&
      env.mpesaConsumerSecret &&
      env.mpesaShortcode &&
      env.mpesaPasskey
  );
  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    mode: env.mpesaEnv,
    transactionType: env.mpesaTransactionType,
    shortcode: env.mpesaShortcode ? "***" + String(env.mpesaShortcode).slice(-4) : null,
  };
};

const collectStripe = () => {
  const enabled = Boolean(env.stripeSecretKey);
  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    currency: env.stripeCurrency || null,
  };
};

const collectStorage = () => {
  const provider = env.storageProvider || "local";
  const enabled =
    provider === "local"
      ? true
      : Boolean(
          env.cloudinaryCloudName &&
            env.cloudinaryApiKey &&
            env.cloudinaryApiSecret
        );

  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    type: provider === "local" ? "Local" : "Cloudinary",
    cloud: provider === "cloudinary" ? env.cloudinaryCloudName || null : null,
    path: provider === "local" ? env.localStoragePath || null : null,
  };
};

const collectFirebase = () => {
  const enabled = env.firebaseEnabled === true;
  return {
    status: enabled ? "enabled" : "disabled",
    enabled,
    project: enabled ? env.firebaseProjectId || null : null,
  };
};

const collectBackups = async () => {
  const [total, lastSuccess] = await Promise.all([
    Backup.countDocuments({ status: "success" }),
    Backup.findOne({ status: "success" }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    status: "enabled",
    type: "JSON + local storage",
    count: total,
    lastBackupAt: lastSuccess?.createdAt || null,
    lastBackupSize: lastSuccess?.size || null,
    lastBackupFile: lastSuccess?.filename || null,
  };
};

const collectSettings = async () => {
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const branding = await Branding.findOne().lean();
  const g = general?.value || {};

  return {
    appName: g.appName || "Digital Safaris",
    logoUrl: branding?.logoUrl || branding?.logo || g.logoUrl || null,
    supportEmail: g.supportEmail || null,
    supportPhone: g.supportPhone || null,
    timezone: g.timezone || "Africa/Nairobi",
    currency: g.currency || "KES",
  };
};

const collectCors = () => ({
  client: env.clientUrl || null,
  admin: env.adminUrl || null,
  partner: env.partnerUrl || null,
  website: env.websiteUrl || null,
});

const computeOverall = (sections) => {
  const keys = [
    "server",
    "database",
    "redis",
    "email",
    "sms",
    "ai",
    "mpesa",
    "stripe",
    "storage",
    "firebase",
  ];

  let up = 0;
  for (const k of keys) {
    const s = sections[k]?.status;
    if (["up", "enabled", "connected", "disabled"].includes(s)) up++;
  }
  return { up, total: keys.length };
};

const health = asyncHandler(async (_req, res) => {
  const [
    server,
    database,
    redis,
    email,
    sms,
    ai,
    mpesa,
    stripe,
    storage,
    firebase,
    backups,
    settings,
  ] = await Promise.all([
    collectServer(),
    collectDatabase(),
    collectRedis(),
    collectEmail(),
    collectSms(),
    collectAi(),
    collectMpesa(),
    collectStripe(),
    collectStorage(),
    collectFirebase(),
    collectBackups(),
    collectSettings(),
  ]);

  const sections = {
    server,
    database,
    redis,
    email,
    sms,
    ai,
    mpesa,
    stripe,
    storage,
    firebase,
  };
  const overall = computeOverall(sections);

  return ok(res, {
    status:
      overall.up === overall.total
        ? "healthy"
        : overall.up > 1
        ? "degraded"
        : "unhealthy",
    overall,
    timestamp: new Date().toISOString(),
    platform: settings,
    server,
    database,
    redis,
    email,
    sms,
    ai,
    mpesa,
    stripe,
    storage,
    firebase,
    backups,
    cors: collectCors(),
  });
});

const ready = asyncHandler(async (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  if (!dbUp) {
    return res.status(503).json({
      success: false,
      error: { code: "NOT_READY", message: "Database unavailable" },
    });
  }
  return ok(res, { ready: true });
});

const metrics = asyncHandler(async (_req, res) => {
  const mem = process.memoryUsage();
  return ok(res, {
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    },
    cpu: {
      cores: os.cpus().length,
      loadAvg: os.loadavg(),
      model: os.cpus()[0]?.model || null,
    },
    node: process.version,
    platform: `${os.type()} ${os.release()}`,
    pid: process.pid,
  });
});

export { health, ready, metrics };