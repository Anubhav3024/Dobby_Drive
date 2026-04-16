const { z } = require("zod");

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  parentFolderId: z.string().nullable().optional(),
});

const renameFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

module.exports = { createFolderSchema, renameFolderSchema };
