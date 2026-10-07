import cors from "cors";
import { env } from "../../config/env.js";

const allowed = env.corsOrigins.length
  ? env.corsOrigins
  : [env.clientUrl, env.adminUrl, env.partnerUrl, env.websiteUrl].filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowed.includes("*")) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "Content-Disposition"],
  maxAge: 86400,
});

export default corsMiddleware;