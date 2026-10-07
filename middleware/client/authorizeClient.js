import ApiError from "../../utils/apiError.js";

const authorizeClient = (req, res, next) => {
  if (!req.customer) {
    return next(new ApiError(401, "Authentication required"));
  }
  next();
};

export default authorizeClient;