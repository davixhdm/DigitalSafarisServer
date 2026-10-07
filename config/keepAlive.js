import axios from "axios";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let timer = null;
let stopped = false;

const INTERVAL_MS = 10 * 60 * 1000;
const FIRST_PING_MS = 60 * 1000;

const pingHealth = async () => {
  if (stopped) return;
  if (!env.keepAliveEnabled) return;
  if (!env.apiUrl) return;

  try {
    const res = await axios.get(`${env.apiUrl}/health`, { timeout: 10000 });
    logger.debug("Keep-alive ping", { status: res.status });
  } catch (err) {
    logger.warn("Keep-alive ping failed", {
      error: err.response?.status || err.message,
    });
  }
};

const scheduleNext = () => {
  if (stopped || !env.keepAliveEnabled) return;
  timer = setTimeout(async () => {
    await pingHealth();
    scheduleNext();
  }, INTERVAL_MS);
  if (timer.unref) timer.unref();
};

const startKeepAlive = () => {
  if (!env.keepAliveEnabled) {
    logger.info("Keep-alive: disabled");
    return;
  }
  if (!env.apiUrl) {
    logger.warn("Keep-alive: API_URL missing, cannot start");
    return;
  }

  logger.info("Keep-alive: enabled, first ping in 1 minute");
  const first = setTimeout(async () => {
    await pingHealth();
    scheduleNext();
  }, FIRST_PING_MS);
  if (first.unref) first.unref();
};

const stopKeepAlive = () => {
  stopped = true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

export { startKeepAlive, stopKeepAlive };