import { env } from "../../config/env.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message =
      error.message || "Something went wrong. Please try again.";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    status: error.status,
    color: error.color,
    message: error.message,
    errors: error.errors || [],
    timestamp: error.timestamp,
  };

  if (env.nodeEnv === "development") {
    response.stack = error.stack;
  }

  if (error.statusCode >= 500) {
    logger.error(error.message, { stack: error.stack, path: req.originalUrl });
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;