const Folder = require("../models/Folder");
const File = require("../models/File");
const ApiError = require("../utils/apiError");

async function adjustFolderSizes({ userId, folder, deltaBytes }) {
  if (!folder) {
    throw new ApiError(404, "Folder not found", "FOLDER_NOT_FOUND");
  }

  await Folder.updateOne(
    { _id: folder._id, userId },
    { $inc: { directSize: deltaBytes } },
  );

  await Folder.updateMany(
    { _id: { $in: folder.path }, userId },
    { $inc: { aggregatedSize: deltaBytes } },
  );
}

async function recomputeAllFolderSizes() {
  const folders = await Folder.find({}).lean();
  const files = await File.find({}).lean();

  const byId = new Map();
  folders.forEach((folder) => {
    byId.set(folder._id.toString(), {
      ...folder,
      directSize: 0,
      aggregatedSize: 0,
    });
  });

  files.forEach((file) => {
    const folder = byId.get(file.folderId.toString());
    if (folder) {
      folder.directSize += file.size;
    }
  });

  const sorted = Array.from(byId.values()).sort(
    (a, b) => b.path.length - a.path.length,
  );

  sorted.forEach((folder) => {
    folder.aggregatedSize += folder.directSize;
    if (folder.parentFolderId) {
      const parent = byId.get(folder.parentFolderId.toString());
      if (parent) {
        parent.aggregatedSize += folder.aggregatedSize;
      }
    }
  });

  if (sorted.length === 0) {
    return { updated: 0 };
  }

  const bulkOps = sorted.map((folder) => ({
    updateOne: {
      filter: { _id: folder._id },
      update: {
        $set: {
          directSize: folder.directSize,
          aggregatedSize: folder.aggregatedSize,
        },
      },
    },
  }));

  const result = await Folder.bulkWrite(bulkOps);
  return { updated: result.modifiedCount || 0 };
}

module.exports = { adjustFolderSizes, recomputeAllFolderSizes };
