import { validationResult } from "express-validator";
import ApiError from "../../utils/apiError.js";

const validateClient = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ApiError(422, "Validation failed", formatted));
  }
  next();
};

export default validateClient;