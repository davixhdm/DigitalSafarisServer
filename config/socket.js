import { Server } from "socket.io";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let io = null;

const allowed = env.corsOrigins.length
  ? env.corsOrigins
  : [env.clientUrl, env.adminUrl, env.partnerUrl, env.websiteUrl].filter(Boolean);

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowed,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    socket.on("join", (room) => {
      if (typeof room === "string" && room.length < 64) {
        socket.join(room);
      }
    });

    socket.on("leave", (room) => {
      if (typeof room === "string") socket.leave(room);
    });

    socket.on("disconnect", () => {});
  });

  logger.info("Socket.IO handler registered");
  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

export { initSocket, getIO };