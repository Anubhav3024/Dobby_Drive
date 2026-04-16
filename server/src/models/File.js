const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    name: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageType: {
      type: String,
      enum: ["local"],
      default: "local",
    },
    storageUrl: { type: String, required: true },
  },
  { timestamps: true },
);

FileSchema.index({ userId: 1, folderId: 1 });
FileSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("File", FileSchema);
