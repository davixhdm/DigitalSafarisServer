const ERROR_COLORS = {
  400: "#F59E0B",
  401: "#EF4444",
  403: "#EF4444",
  404: "#F59E0B",
  409: "#F59E0B",
  422: "#F59E0B",
  429: "#EF4444",
  500: "#EF4444",
  502: "#EF4444",
  503: "#EF4444",
};

const ERROR_LABELS = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.isOperational = true;
    this.status = ERROR_LABELS[statusCode] || "Error";
    this.color = ERROR_COLORS[statusCode] || "#EF4444";
    this.timestamp = new Date().toISOString();

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;