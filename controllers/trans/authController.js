import TransportPartner from "../../models/trans/TransportPartner.js";
import comparePassword from "../../utils/comparePassword.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/generateToken.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const partner = await TransportPartner.findOne({ email, isDeleted: false })
    .select("+password");

  if (!partner) throw new ApiError(401, "Invalid credentials");
  if (partner.status === "suspended") throw new ApiError(403, "Account suspended");
  if (partner.status === "pending") throw new ApiError(403, "Account pending approval");
  if (partner.status === "rejected") throw new ApiError(403, "Account rejected");

  const match = await comparePassword(password, partner.password);
  if (!match) throw new ApiError(401, "Invalid credentials");

  const accessToken = generateAccessToken({ id: partner._id, type: "transport" });
  const refreshToken = generateRefreshToken({ id: partner._id, type: "transport" });

  partner.refreshToken = refreshToken;
  partner.lastLogin = new Date();
  await partner.save();

  const safe = partner.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(
    new ApiResponse(200, { partner: safe, accessToken, refreshToken }, "Login successful")
  );
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);
  const partner = await TransportPartner.findById(decoded.id);
  if (!partner || partner.isDeleted) throw new ApiError(401, "Invalid session");
  if (partner.refreshToken !== refreshToken) throw new ApiError(401, "Session revoked");

  const accessToken = generateAccessToken({ id: partner._id, type: "transport" });
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

const logout = asyncHandler(async (req, res) => {
  await TransportPartner.updateOne(
    { _id: req.partner._id },
    { $set: { refreshToken: null } }
  );
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

const me = asyncHandler(async (req, res) => {
  const partner = await TransportPartner.findById(req.partner._id);
  const safe = partner.toObject();
  delete safe.password;
  delete safe.refreshToken;
  res.status(200).json(new ApiResponse(200, safe, "Profile fetched"));
});

export { login, refresh, logout, me };