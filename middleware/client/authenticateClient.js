import { verifyAccessToken } from "../../utils/generateToken.js";
import ApiError from "../../utils/apiError.js";
import Customer from "../../models/customer/Customer.js";

const authenticateClient = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const customer = await Customer.findById(decoded.id);

    if (!customer || customer.isDeleted) {
      throw new ApiError(401, "Invalid session");
    }

    if (customer.status === "suspended") {
      throw new ApiError(403, "Account suspended");
    }

    req.customer = customer;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, "Invalid or expired token"));
  }
};

export default authenticateClient;