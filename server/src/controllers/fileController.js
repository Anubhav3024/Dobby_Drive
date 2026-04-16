const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const File = require("../models/File");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId } = require("../utils/objectId");
const { adjustFolderSizes } = require("../services/sizeService");
const { removeLocalFile } = require("../services/storageService");
const env = require("../config/env");

const toFileResponse = (file) => ({
  id: file._id,
  originalName: file.originalName,
  name: file.name,
  storedName: file.storedName,
  mimeType: file.mimeType,
  size: file.size,
  folderId: file.folderId,
  storageUrl: `/api/files/${file._id}/content`,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const uploadFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { folderId, name } = req.body;
  const displayName = String(name || "").trim();

  if (!folderId || !isValidObjectId(folderId)) {
    if (req.file) {
      await removeLocalFile(req.file.path);
    }
    throw new ApiError(400, "Invalid folder id", "INVALID_FOLDER_ID");
  }

  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) {
    if (req.file) {
      await removeLocalFile(req.file.path);
    }
    throw new ApiError(404, "Folder not found", "FOLDER_NOT_FOUND");
  }

  if (!req.file) {
    throw new ApiError(400, "Image file is required", "FILE_REQUIRED");
  }

  if (!displayName) {
    await removeLocalFile(req.file.path);
    throw new ApiError(400, "Name is required", "NAME_REQUIRED");
  }

  const fileId = new mongoose.Types.ObjectId();
  const fileDoc = await File.create({
    _id: fileId,
    userId,
    folderId,
    originalName: req.file.originalname,
    name: displayName,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageType: "local",
    storageUrl: `/api/files/${fileId}/content`,
  });

  await adjustFolderSizes({ userId, folder, deltaBytes: req.file.size });

  res.status(201).json({ file: toFileResponse(fileDoc) });
});

const listFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { folderId } = req.query;

  if (!folderId || !isValidObjectId(folderId)) {
    throw new ApiError(400, "Invalid folder id", "INVALID_FOLDER_ID");
  }

  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) {
    throw new ApiError(404, "Folder not found", "FOLDER_NOT_FOUND");
  }

  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "20", 10), 1),
    100,
  );

  const query = { userId, folderId };
  const [items, total] = await Promise.all([
    File.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    File.countDocuments(query),
  ]);

  res.json({
    items: items.map(toFileResponse),
    pagination: { page, limit, total },
  });
});

const getFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.id;

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file id", "INVALID_FILE_ID");
  }

  const file = await File.findOne({ _id: fileId, userId });
  if (!file) {
    throw new ApiError(404, "File not found", "FILE_NOT_FOUND");
  }

  res.json({ file: toFileResponse(file) });
});

const getFileContent = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.id;

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file id", "INVALID_FILE_ID");
  }

  const file = await File.findOne({ _id: fileId, userId });
  if (!file) {
    throw new ApiError(404, "File not found", "FILE_NOT_FOUND");
  }

  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, file.storedName);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File missing on disk", "FILE_MISSING");
  }

  // Allow the frontend (different origin/port) to render image responses.
  // This is required in some setups (e.g. localhost vs 127.0.0.1) where browsers
  // enforce Cross-Origin-Resource-Policy for embedded resources.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", "inline");
  res.sendFile(filePath);
});

const downloadFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.id;

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file id", "INVALID_FILE_ID");
  }

  const file = await File.findOne({ _id: fileId, userId });
  if (!file) {
    throw new ApiError(404, "File not found", "FILE_NOT_FOUND");
  }

  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, file.storedName);
  res.download(filePath, file.originalName);
});

const deleteFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.id;

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file id", "INVALID_FILE_ID");
  }

  const file = await File.findOne({ _id: fileId, userId });
  if (!file) {
    throw new ApiError(404, "File not found", "FILE_NOT_FOUND");
  }

  const folder = await Folder.findOne({ _id: file.folderId, userId });

  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, file.storedName);
  await removeLocalFile(filePath);
  await File.deleteOne({ _id: file._id });

  if (folder) {
    await adjustFolderSizes({ userId, folder, deltaBytes: -file.size });
  }

  res.json({ message: "File deleted" });
});

module.exports = {
  uploadFile,
  listFiles,
  getFile,
  getFileContent,
  downloadFile,
  deleteFile,
};
