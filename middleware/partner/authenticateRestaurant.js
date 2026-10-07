import { verifyAccessToken } from "../../utils/generateToken.js";
import ApiError from "../../utils/apiError.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";

const authenticateRestaurant = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.slice(7);
    const decoded = verifyAccessToken(token);

    if (decoded.type !== "restaurant") {
      throw new ApiError(401, "Invalid token type");
    }

    const partner = await RestaurantPartner.findById(decoded.id);
    if (!partner || partner.isDeleted) {
      throw new ApiError(401, "Invalid session");
    }
    if (partner.status === "suspended") {
      throw new ApiError(403, "Account suspended");
    }

    req.partner = partner;
    next();
  } catch (err) {
    next(
      err instanceof ApiError
        ? err
        : new ApiError(401, "Invalid or expired token")
    );
  }
};

export default authenticateRestaurant;