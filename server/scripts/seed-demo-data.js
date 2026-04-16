/* eslint-disable no-console */
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

const env = require("../src/config/env");
const { connectDB } = require("../src/config/db");
const User = require("../src/models/User");
const Folder = require("../src/models/Folder");
const File = require("../src/models/File");
const { recomputeAllFolderSizes } = require("../src/services/sizeService");

const RESET_FLAG = process.argv.includes("--reset");

function guardProduction() {
  if (env.NODE_ENV !== "production") return;
  if (process.env.FORCE_SEED === "true") return;
  throw new Error(
    "Refusing to seed in production. Set FORCE_SEED=true to override.",
  );
}

function toSafeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function makeSvg({ title, subtitle, accent = "#4f46e5", bg = "#eef2ff" }) {
  const safeTitle = String(title || "Untitled").slice(0, 60);
  const safeSubtitle = String(subtitle || "").slice(0, 80);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="r" cx="35%" cy="30%" r="60%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="800" rx="44" fill="url(#g)"/>
  <rect width="1200" height="800" rx="44" fill="url(#r)"/>

  <g transform="translate(90 92)">
    <rect x="0" y="0" width="132" height="132" rx="34" fill="#ffffff" stroke="${accent}" stroke-opacity="0.22"/>
    <path d="M34 56c0-9 7-16 16-16h44c9 0 16 7 16 16v40c0 13-11 24-24 24H58c-13 0-24-11-24-24V56Z" fill="none" stroke="${accent}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M50 60h44M50 78h34" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="6" stroke-linecap="round"/>
    <circle cx="92" cy="104" r="6" fill="${accent}"/>
  </g>

  <g font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" fill="#111827">
    <text x="90" y="330" font-size="64" font-weight="800" letter-spacing="-1">${escapeXml(
      safeTitle,
    )}</text>
    <text x="90" y="390" font-size="28" font-weight="600" fill="#6b7280">${escapeXml(
      safeSubtitle,
    )}</text>
  </g>

  <g opacity="0.9" transform="translate(90 470)">
    <rect x="0" y="0" width="1020" height="230" rx="34" fill="#ffffff" stroke="#e5e7eb"/>
    <rect x="36" y="44" width="270" height="18" rx="9" fill="#e5e7eb"/>
    <rect x="36" y="80" width="430" height="14" rx="7" fill="#eef2ff"/>
    <rect x="36" y="120" width="520" height="14" rx="7" fill="#eef2ff"/>
    <rect x="36" y="160" width="320" height="14" rx="7" fill="#eef2ff"/>

    <rect x="760" y="52" width="220" height="52" rx="18" fill="${accent}" opacity="0.92"/>
  </g>
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function ensureUploadsDir() {
  const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function createDemoUser() {
  const email = (process.env.DEMO_EMAIL || "demo@dobby.local")
    .trim()
    .toLowerCase();
  const password = process.env.DEMO_PASSWORD || "Password123!";
  const name = process.env.DEMO_NAME || "Demo Reviewer";

  const existing = await User.findOne({ email });
  if (existing) {
    return { user: existing, email, password, created: false };
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });
  return { user, email, password, created: true };
}

async function maybeResetUserData({ userId, uploadBase }) {
  if (!RESET_FLAG) return;

  const files = await File.find({ userId }).select("storedName");
  for (const f of files) {
    const p = path.resolve(uploadBase, f.storedName);
    try {
      await fs.unlink(p);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  await File.deleteMany({ userId });
  await Folder.deleteMany({ userId });
}

async function seedFoldersAndFiles({ userId, uploadBase }) {
  const existingFolderCount = await Folder.countDocuments({ userId });
  const existingFileCount = await File.countDocuments({ userId });
  if (!RESET_FLAG && (existingFolderCount > 0 || existingFileCount > 0)) {
    console.log(
      "Demo data already exists for this user. Re-run with --reset to recreate.",
    );
    return;
  }

  const createFolder = async ({ name, parent = null }) => {
    const folderId = new mongoose.Types.ObjectId();
    const pathList = parent ? [...parent.path, folderId] : [folderId];

    const folder = await Folder.create({
      _id: folderId,
      userId,
      name,
      parentFolderId: parent ? parent._id : null,
      path: pathList,
      directSize: 0,
      aggregatedSize: 0,
    });

    return folder;
  };

  const roots = {
    projects: await createFolder({ name: "Projects" }),
    photos: await createFolder({ name: "Photos" }),
    receipts: await createFolder({ name: "Receipts" }),
  };

  const dd = await createFolder({
    name: "Dobby Drive",
    parent: roots.projects,
  });
  const design = await createFolder({ name: "Design", parent: roots.projects });
  const trips = await createFolder({ name: "Trips", parent: roots.photos });
  const himachal = await createFolder({ name: "Himachal 2026", parent: trips });
  const year2026 = await createFolder({ name: "2026", parent: roots.receipts });
  const april = await createFolder({ name: "April", parent: year2026 });

  const createSvgFile = async ({ folder, title, subtitle, accent, bg }) => {
    const fileId = new mongoose.Types.ObjectId();
    const originalName = `${title}.svg`;
    const storedName = `${crypto.randomUUID()}-seed-${toSafeFileName(
      originalName,
    )}`;

    const svg = makeSvg({ title, subtitle, accent, bg });
    const buf = Buffer.from(svg, "utf8");
    await fs.writeFile(path.resolve(uploadBase, storedName), buf);

    await File.create({
      _id: fileId,
      userId,
      folderId: folder._id,
      originalName,
      name: title,
      storedName,
      mimeType: "image/svg+xml",
      size: buf.length,
      storageType: "local",
      storageUrl: `/api/files/${fileId}/content`,
    });
  };

  await createSvgFile({
    folder: dd,
    title: "Landing Concept",
    subtitle: "3D icon + wipe transition",
    accent: "#4f46e5",
    bg: "#eef2ff",
  });
  await createSvgFile({
    folder: dd,
    title: "Dashboard Cards",
    subtitle: "Square folders + clean actions",
    accent: "#4338ca",
    bg: "#eef2ff",
  });

  await createSvgFile({
    folder: design,
    title: "Brand Kit",
    subtitle: "Logo, colors, and UI tokens",
    accent: "#7c3aed",
    bg: "#f5f3ff",
  });

  await createSvgFile({
    folder: himachal,
    title: "Sunset",
    subtitle: "Demo image for grid preview",
    accent: "#f97316",
    bg: "#fff7ed",
  });
  await createSvgFile({
    folder: himachal,
    title: "Mountains",
    subtitle: "Demo image for nested folders",
    accent: "#06b6d4",
    bg: "#ecfeff",
  });

  await createSvgFile({
    folder: april,
    title: "Invoice 0416",
    subtitle: "Receipt sample",
    accent: "#10b981",
    bg: "#ecfdf5",
  });

  await recomputeAllFolderSizes();

  console.log("Seeded demo folders + images.");
  console.log("Root folders:");
  console.log("  Projects → Dobby Drive / Design");
  console.log("  Photos → Trips → Himachal 2026");
  console.log("  Receipts → 2026 → April");
}

async function main() {
  guardProduction();
  await connectDB();

  const uploadBase = await ensureUploadsDir();

  const { user, email, password, created } = await createDemoUser();
  const userId = String(user._id);

  await maybeResetUserData({ userId, uploadBase });
  await seedFoldersAndFiles({ userId, uploadBase });

  console.log("\nDemo account:");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}${created ? "" : " (existing)"}`);
  if (RESET_FLAG) {
    console.log("  note: data was reset (--reset)");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
