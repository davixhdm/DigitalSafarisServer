import cors from "cors";
import { env } from "../../config/env.js";

const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowed = [
      env.clientUrl,
      env.adminUrl,
      env.partnerUrl,
      env.websiteUrl,
    ].filter(Boolean);

    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

export default corsMiddleware;