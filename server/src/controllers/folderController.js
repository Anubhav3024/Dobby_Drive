const path = require("path");
const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const File = require("../models/File");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId } = require("../utils/objectId");
const { removeLocalFile } = require("../services/storageService");
const env = require("../config/env");

const toFolderResponse = (folder, { fileCount = 0 } = {}) => ({
  id: folder._id,
  name: folder.name,
  parentFolderId: folder.parentFolderId,
  path: folder.path,
  directSize: folder.directSize,
  aggregatedSize: folder.aggregatedSize,
  fileCount,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
});

const parseParentFolderId = (value) => {
  if (!value || value === "null" || value === "root") {
    return null;
  }
  if (!isValidObjectId(value)) {
    throw new ApiError(400, "Invalid parent folder id", "INVALID_PARENT_ID");
  }
  return value;
};

const createFolder = asyncHandler(async (req, res) => {
  const { name, parentFolderId } = req.body;
  const userId = req.user.id;

  let parent = null;
  if (parentFolderId) {
    if (!isValidObjectId(parentFolderId)) {
      throw new ApiError(400, "Invalid parent folder id", "INVALID_PARENT_ID");
    }
    parent = await Folder.findOne({ _id: parentFolderId, userId });
    if (!parent) {
      throw new ApiError(404, "Parent folder not found", "FOLDER_NOT_FOUND");
    }
  }

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

  res.status(201).json({
    message: "Folder created",
    folder: toFolderResponse(folder),
  });
});

const listFolders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parentFolderId = parseParentFolderId(req.query.parentFolderId);
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "20", 10), 1),
    100,
  );

  const query = { userId, parentFolderId };
  const [items, total] = await Promise.all([
    Folder.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Folder.countDocuments(query),
  ]);

  const folderIds = items.map((f) => f._id);
  const counts = folderIds.length
    ? await File.aggregate([
        { $match: { userId, folderId: { $in: folderIds } } },
        { $group: { _id: "$folderId", count: { $sum: 1 } } },
      ])
    : [];

  const fileCountMap = new Map(
    counts.map((row) => [row._id.toString(), row.count]),
  );

  res.json({
    items: items.map((folder) =>
      toFolderResponse(folder, {
        fileCount: fileCountMap.get(folder._id.toString()) || 0,
      }),
    ),
    pagination: { page, limit, total },
  });
});

const getFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const folderId = req.params.id;

  if (!isValidObjectId(folderId)) {
    throw new ApiError(400, "Invalid folder id", "INVALID_FOLDER_ID");
  }

  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) {
    throw new ApiError(404, "Folder not found", "FOLDER_NOT_FOUND");
  }

  const fileCount = await File.countDocuments({ userId, folderId: folder._id });
  res.json({ folder: toFolderResponse(folder, { fileCount }) });
});

const renameFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const folderId = req.params.id;

  if (!isValidObjectId(folderId)) {
    throw new ApiError(400, "Invalid folder id", "INVALID_FOLDER_ID");
  }

  const folder = await Folder.findOneAndUpdate(
    { _id: folderId, userId },
    { name: req.body.name },
    { new: true },
  );

  if (!folder) {
    throw new ApiError(404, "Folder not found", "FOLDER_NOT_FOUND");
  }

  res.json({ folder: toFolderResponse(folder) });
});

const listTree = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const items = await Folder.find({ userId }).sort({ path: 1, name: 1 });

  res.json({ items: items.map(toFolderResponse) });
});

const getSubtree = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const folderId = req.params.id;

  if (!isValidObjectId(folderId)) {
    throw new ApiError(400, "Invalid folder id", "INVALID_FOLDER_ID");
  }

  const items = await Folder.find({ userId, path: folderId }).sort({
    path: 1,
    name: 1,
  });

  res.json({ items: items.map(toFolderResponse) });
});

const deleteFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const folderId = req.params.id;

  if (!isValidObjectId(folderId)) {
    throw new ApiError(400, "Invalid folder id", "INVALID_FOLDER_ID");
  }

  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) {
    throw new ApiError(404, "Folder not found", "FOLDER_NOT_FOUND");
  }

  const descendants = await Folder.find({ userId, path: folder._id }).select(
    "_id",
  );
  const folderIds = descendants.map((item) => item._id);

  const files = await File.find({
    userId,
    folderId: { $in: folderIds },
  });

  const uploadBase = path.resolve(process.cwd(), env.UPLOAD_DIR);
  for (const file of files) {
    const filePath = path.join(uploadBase, file.storedName);
    await removeLocalFile(filePath);
  }

  await File.deleteMany({ userId, folderId: { $in: folderIds } });
  await Folder.deleteMany({ userId, _id: { $in: folderIds } });

  const ancestorIds = folder.path.slice(0, -1);
  if (ancestorIds.length > 0) {
    await Folder.updateMany(
      { userId, _id: { $in: ancestorIds } },
      { $inc: { aggregatedSize: -folder.aggregatedSize } },
    );
  }

  res.json({ message: "Folder deleted" });
});

module.exports = {
  createFolder,
  listFolders,
  getFolder,
  renameFolder,
  listTree,
  getSubtree,
  deleteFolder,
};
