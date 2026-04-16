const dotenv = require("dotenv");

dotenv.config();

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 4000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/dobby_drive",
  DNS_SERVERS: process.env.DNS_SERVERS || "",
  CLIENT_ORIGINS: parseCsv(
    process.env.CLIENT_URLS ||
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  ),
  CLIENT_URL: "",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB || 10),
  ADMIN_RECOMPUTE_KEY: process.env.ADMIN_RECOMPUTE_KEY || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  COOKIE_NAME: process.env.COOKIE_NAME || "dobby_token",
  COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE || "lax").toLowerCase(),
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
};

env.CLIENT_URL = env.CLIENT_ORIGINS[0] || "http://localhost:5173";

module.exports = env;
