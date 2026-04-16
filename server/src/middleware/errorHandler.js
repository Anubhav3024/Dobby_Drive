const env = require("../config/env");

function notFoundHandler(req, res) {
  res.status(404).json({
    message: "Route not found",
    code: "ROUTE_NOT_FOUND",
    details: null,
  });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Internal server error";
  let details = err.details || null;

  if (err.name === "ZodError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid request data";
    details = err.errors;
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    code = "FILE_TOO_LARGE";
    message = `File exceeds ${env.MAX_FILE_SIZE_MB} MB limit`;
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "Resource already exists";
    details = err.keyValue || null;
  }

  res.status(statusCode).json({ message, code, details });
}

module.exports = { errorHandler, notFoundHandler };
