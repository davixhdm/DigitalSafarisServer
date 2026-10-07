import ApiResponse from "./ApiResponse.js";

const sendResponse = (res, statusCode, data, message = "Success") => {
  const response = new ApiResponse(statusCode, data, message);
  return res.status(statusCode).json(response);
};

export default sendResponse;