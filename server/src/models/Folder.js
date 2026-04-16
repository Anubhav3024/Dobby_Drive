const mongoose = require("mongoose");

const FolderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    path: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
        required: true,
      },
    ],
    directSize: { type: Number, default: 0 },
    aggregatedSize: { type: Number, default: 0 },
  },
  { timestamps: true },
);

FolderSchema.index({ userId: 1, parentFolderId: 1 });
FolderSchema.index({ userId: 1, path: 1 });

module.exports = mongoose.model("Folder", FolderSchema);
