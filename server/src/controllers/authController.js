const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

function getCookieOptions() {
  const isProd = env.NODE_ENV === "production";
  const sameSite =
    env.COOKIE_SAMESITE === "none"
      ? "none"
      : env.COOKIE_SAMESITE === "strict"
        ? "strict"
        : "lax";

  return {
    httpOnly: true,
    secure: isProd || sameSite === "none",
    sameSite,
    path: "/",
  };
}

function signToken(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function toUserResponse(user) {
  return { id: user._id, name: user.name, email: user.email };
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already registered", "EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user._id);
  res.cookie(env.COOKIE_NAME, token, getCookieOptions());

  res.status(201).json({ user: toUserResponse(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = signToken(user._id);
  res.cookie(env.COOKIE_NAME, token, getCookieOptions());

  res.json({ user: toUserResponse(user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.COOKIE_NAME, { ...getCookieOptions(), maxAge: 0 });
  res.json({ message: "Logged out" });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
  }
  res.json({ user: toUserResponse(user) });
});

module.exports = { signup, login, logout, me };

