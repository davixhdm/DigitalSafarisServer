const STATUS_COLORS = {
  200: "#22C55E",
  201: "#22C55E",
  202: "#22C55E",
  204: "#6B7280",
  301: "#3B82F6",
  302: "#3B82F6",
  304: "#6B7280",
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

const STATUS_LABELS = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
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

class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.status = STATUS_LABELS[statusCode] || "Unknown";
    this.color = STATUS_COLORS[statusCode] || (statusCode < 400 ? "#22C55E" : "#EF4444");
    this.timestamp = new Date().toISOString();
  }
}

export default ApiResponse;