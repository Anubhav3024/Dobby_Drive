const env = require("../config/env");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { recomputeAllFolderSizes } = require("../services/sizeService");

const recomputeSizes = asyncHandler(async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (!env.ADMIN_RECOMPUTE_KEY || adminKey !== env.ADMIN_RECOMPUTE_KEY) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  const result = await recomputeAllFolderSizes();
  res.json({ message: "Sizes recomputed", ...result });
});

module.exports = { recomputeSizes };
