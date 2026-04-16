const express = require("express");
const {
  createFolder,
  listFolders,
  getFolder,
  renameFolder,
  listTree,
  getSubtree,
  deleteFolder,
} = require("../controllers/folderController");
const { validateBody } = require("../middleware/validate");
const {
  createFolderSchema,
  renameFolderSchema,
} = require("../validators/folderSchemas");

const router = express.Router();

router.get("/", listFolders);
router.get("/tree", listTree);
router.post("/", validateBody(createFolderSchema), createFolder);
router.get("/:id", getFolder);
router.get("/:id/tree", getSubtree);
router.patch("/:id", validateBody(renameFolderSchema), renameFolder);
router.delete("/:id", deleteFolder);

module.exports = router;
