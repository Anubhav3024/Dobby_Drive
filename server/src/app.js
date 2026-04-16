const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
const env = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const auth = require("./middleware/auth");
const { authLimiter } = require("./middleware/rateLimiters");
const authRoutes = require("./routes/authRoutes");
const folderRoutes = require("./routes/folderRoutes");
const fileRoutes = require("./routes/fileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const healthRoutes = require("./routes/healthRoutes");
const mcpRoutes = require("./routes/mcpRoutes");

const app = express();

if (!env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET. Set it in server/.env");
}

function isLocalDevOrigin(origin) {
  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

const allowedOriginSet = new Set(env.CLIENT_ORIGINS || []);

app.use(
  helmet({
    // Fix: allow the frontend (localhost on a different port) to embed image responses
    // from this API without the browser blocking them.
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }

      if (env.NODE_ENV !== "production" && isLocalDevOrigin(origin)) {
        return cb(null, true);
      }

      if (allowedOriginSet.has(origin)) {
        return cb(null, true);
      }

      return cb(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const openApiPath = path.join(__dirname, "docs", "openapi.json");
if (fs.existsSync(openApiPath)) {
  const openApiDoc = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));
}

app.use("/api/health", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/folders", auth, folderRoutes);
app.use("/api/files", auth, fileRoutes);
app.use("/api/admin", auth, adminRoutes);
app.use("/api/mcp", auth, mcpRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
