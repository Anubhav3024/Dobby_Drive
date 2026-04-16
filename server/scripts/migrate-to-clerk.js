const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { clerkClient } = require("@clerk/express");

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printUsageAndExit(code = 0) {
  // Intentionally short; this script is meant to be run by the repo owner.
  console.log(`
Migrate legacy MongoDB data from local JWT users -> Clerk user IDs.

Default is DRY-RUN (no writes). Add --yes to apply changes.

Usage:
  node scripts/migrate-to-clerk.js [--yes] [--mapping mapping.json] [--create-missing]

Options:
  --yes               Apply updates to MongoDB (otherwise dry-run)
  --mapping <file>    JSON map of { "<legacyUserObjectId>": "user_..." }
  --create-missing    Create Clerk users when email not found (requires --yes)
  --help              Show this help
`.trim());
  process.exit(code);
}

async function findClerkUserByEmail(email) {
  const response = await clerkClient.users.getUserList({
    emailAddress: [email],
    limit: 10,
  });

  const users = response?.data || [];
  return users[0] || null;
}

async function createClerkUserFromLegacy({ email, name }) {
  const [firstName, ...rest] = String(name || "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ") || undefined;

  return clerkClient.users.createUser({
    emailAddress: [email],
    firstName: firstName || undefined,
    lastName,
    skipPasswordRequirement: true,
    skipLegalChecks: true,
  });
}

async function main() {
  if (hasFlag("--help")) {
    printUsageAndExit(0);
  }

  const dryRun = !hasFlag("--yes");
  const mappingPath = getArgValue("--mapping");
  const createMissing = hasFlag("--create-missing");

  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  if (!mappingPath && !process.env.CLERK_SECRET_KEY) {
    console.error(
      "Missing CLERK_SECRET_KEY in server/.env (or pass --mapping to avoid Clerk API calls)",
    );
    process.exit(1);
  }

  if (dryRun && createMissing) {
    console.error("--create-missing requires --yes (it creates Clerk users).");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;

  const usersCol = db.collection("users");
  const foldersCol = db.collection("folders");
  const filesCol = db.collection("files");

  let mappings = [];

  if (mappingPath) {
    const abs = path.isAbsolute(mappingPath)
      ? mappingPath
      : path.join(process.cwd(), mappingPath);
    const json = JSON.parse(fs.readFileSync(abs, "utf8"));
    mappings = Object.entries(json).map(([legacyUserId, clerkUserId]) => ({
      legacyUserId,
      clerkUserId,
      email: null,
      name: null,
      clerkUserFound: true,
    }));
  } else {
    const legacyUsers = await usersCol.find({ email: { $exists: true } }).toArray();
    for (const legacyUser of legacyUsers) {
      const email = String(legacyUser.email || "").trim().toLowerCase();
      if (!email) continue;

      let clerkUser = await findClerkUserByEmail(email);
      if (!clerkUser && createMissing) {
        clerkUser = await createClerkUserFromLegacy({
          email,
          name: legacyUser.name,
        });
      }

      mappings.push({
        legacyUserId: legacyUser._id.toString(),
        clerkUserId: clerkUser?.id || null,
        email,
        name: legacyUser.name || null,
        clerkUserFound: Boolean(clerkUser?.id),
      });
    }
  }

  const applicable = mappings.filter((m) => m.clerkUserFound && m.clerkUserId);
  const skipped = mappings.filter((m) => !m.clerkUserFound);

  let totalFolderMatches = 0;
  let totalFileMatches = 0;
  let updatedFolders = 0;
  let updatedFiles = 0;

  for (const mapping of applicable) {
    const legacyObjectId = new mongoose.Types.ObjectId(mapping.legacyUserId);

    const folderQuery = {
      $or: [{ userId: legacyObjectId }, { userId: mapping.legacyUserId }],
    };
    const fileQuery = {
      $or: [{ userId: legacyObjectId }, { userId: mapping.legacyUserId }],
    };

    const [folderMatches, fileMatches] = await Promise.all([
      foldersCol.countDocuments(folderQuery),
      filesCol.countDocuments(fileQuery),
    ]);

    totalFolderMatches += folderMatches;
    totalFileMatches += fileMatches;

    if (!dryRun) {
      const [folderRes, fileRes] = await Promise.all([
        foldersCol.updateMany(folderQuery, { $set: { userId: mapping.clerkUserId } }),
        filesCol.updateMany(fileQuery, { $set: { userId: mapping.clerkUserId } }),
      ]);
      updatedFolders += folderRes.modifiedCount || 0;
      updatedFiles += fileRes.modifiedCount || 0;
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        mappedUsers: applicable.length,
        skippedUsers: skipped.length,
        folderDocsMatched: totalFolderMatches,
        fileDocsMatched: totalFileMatches,
        folderDocsUpdated: updatedFolders,
        fileDocsUpdated: updatedFiles,
        skipped: skipped.map((s) => ({ legacyUserId: s.legacyUserId, email: s.email })),
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

