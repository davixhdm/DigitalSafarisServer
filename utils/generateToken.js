import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const generateAccessToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpires });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires });

const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);

const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

const generateEmailVerifyToken = (payload) =>
  jwt.sign({ ...payload, purpose: "verify_email" }, env.jwtSecret, {
    expiresIn: "48h",
  });

const verifyEmailVerifyToken = (token) =>
  jwt.verify(token, env.jwtSecret);

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateEmailVerifyToken,
  verifyEmailVerifyToken,
};