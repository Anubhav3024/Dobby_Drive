const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/apiError");

function auth(req, res, next) {
  try {
    const cookieToken = req.cookies?.[env.COOKIE_NAME];
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;

    const token = bearerToken || cookieToken;
    if (!token) {
      return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED"));
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = payload?.sub;
    if (!userId) {
      return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED"));
    }

    req.user = { id: userId };
    return next();
  } catch (err) {
    return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED"));
  }
}

module.exports = auth;
