class ApiError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || "ERROR";
    this.details = details || null;
  }
}

module.exports = ApiError;
