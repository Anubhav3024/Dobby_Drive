const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printHelpAndExit(code = 0) {
  console.log(`
Reset MongoDB data for Clerk (start fresh).

Default is DRY-RUN (no deletes). Add --yes to delete data.

Usage:
  node scripts/reset-db-for-clerk.js [--yes] [--drop]

Options:
  --yes    Delete data (otherwise prints counts only)
  --drop   Drop collections instead of deleteMany
  --help   Show help
`.trim());
  process.exit(code);
}

async function safeCount(collection) {
  try {
    return await collection.countDocuments({});
  } catch {
    return null;
  }
}

async function main() {
  if (hasFlag("--help")) {
    printHelpAndExit(0);
  }

  const apply = hasFlag("--yes");
  const drop = hasFlag("--drop");

  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;

  const names = ["users", "folders", "files"];
  const cols = Object.fromEntries(names.map((n) => [n, db.collection(n)]));

  const before = {};
  for (const name of names) {
    before[name] = await safeCount(cols[name]);
  }

  const result = { apply, drop, before, after: null };

  if (apply) {
    for (const name of names) {
      // If collection doesn't exist, Mongo may error; treat as no-op.
      try {
        if (drop) {
          await cols[name].drop();
        } else {
          await cols[name].deleteMany({});
        }
      } catch (err) {
        // If dropping a non-existing collection, ignore.
        if (drop && err && (err.codeName === "NamespaceNotFound" || err.code === 26)) {
          continue;
        }
        throw err;
      }
    }

    const after = {};
    for (const name of names) {
      after[name] = await safeCount(cols[name]);
    }
    result.after = after;
  }

  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

