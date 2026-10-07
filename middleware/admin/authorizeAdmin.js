import ApiError from "../../utils/apiError.js";

const authorizeAdmin = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new ApiError(401, "Authentication required"));
    }

    const permissions = req.admin.role?.permissions || [];

    if (permissions.includes("*")) return next();

    const hasAll = requiredPermissions.every((perm) =>
      permissions.includes(perm)
    );

    if (!hasAll) {
      return next(new ApiError(403, "Insufficient permissions"));
    }

    next();
  };
};

export default authorizeAdmin;