import { verifyAccessToken } from "../../utils/generateToken.js";
import ApiError from "../../utils/apiError.js";
import Admin from "../../models/admin/Admin.js";

const authenticateAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const admin = await Admin.findById(decoded.id).populate("role");

    if (!admin || admin.isDeleted) {
      throw new ApiError(401, "Invalid session");
    }

    if (admin.status === "suspended") {
      throw new ApiError(403, "Account suspended");
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, "Invalid or expired token"));
  }
};

export default authenticateAdmin;