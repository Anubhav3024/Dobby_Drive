/* eslint-disable no-console */
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const env = require("../src/config/env");
const { connectDB } = require("../src/config/db");
const User = require("../src/models/User");

async function main() {
  await connectDB();

  const email = (process.env.DEMO_EMAIL || "demo@dobby.local")
    .trim()
    .toLowerCase();
  const password = process.env.DEMO_PASSWORD || "Password123!";
  const name = process.env.DEMO_NAME || "Demo User";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Demo user already exists:");
    console.log(`  email: ${email}`);
    console.log(`  password: ${password} (unchanged)`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  await User.create({ name, email, passwordHash });

  console.log("Demo user created:");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });

