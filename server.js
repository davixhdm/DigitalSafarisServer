import "./scripts/dnsSet.js";
import http from "http";
import express from "express";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { initSocket } from "./config/socket.js";
import { initFirebase } from "./config/firebase.js";
import { startSchedulers, stopSchedulers } from "./schedulers/index.js";
import { startKeepAlive, stopKeepAlive } from "./config/keepAlive.js";
import requestLogger from "./middleware/global/requestLogger.js";
import corsMiddleware from "./middleware/global/cors.js";
import helmetMiddleware from "./middleware/global/helmet.js";
import compressionMiddleware from "./middleware/global/compression.js";
import rateLimiter from "./middleware/global/rateLimiter.js";
import sanitize from "./middleware/global/sanitize.js";
import notFound from "./middleware/global/notFound.js";
import errorHandler from "./middleware/global/errorHandler.js";
import routes from "./routes/index.js";
import logger from "./utils/logger.js";

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitize);
app.use(requestLogger);
app.use(rateLimiter);

app.use("/api", routes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: `${env.appName} API`,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

const status = (ok) => (ok ? "OK" : "OFF");

const bootstrap = async () => {
  logger.info(`Starting ${env.appName} (${env.nodeEnv})`);

  await connectDB();
  logger.info("MongoDB: OK");

  const redis = await connectRedis();
  logger.info(`Redis: ${status(redis !== null)}`);

  const firebase = initFirebase();
  logger.info(`Firebase: ${status(firebase !== null)}`);

  initSocket(server);
  logger.info("Socket.IO: OK");

  startSchedulers();
  logger.info("Schedulers: OK");

  server.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`);
    startKeepAlive();
  });
};

const shutdown = async (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);

  stopKeepAlive();

  server.close(async () => {
    try {
      stopSchedulers();
      await disconnectRedis();
      await disconnectDB();
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { error: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err.message, stack: err.stack });
  shutdown("uncaughtException");
});

bootstrap().catch((err) => {
  logger.error("Bootstrap failed", { error: err.message, stack: err.stack });
  process.exit(1);
});