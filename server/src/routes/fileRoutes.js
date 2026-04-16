const express = require("express");
const upload = require("../middleware/upload");
const {
  uploadFile,
  listFiles,
  getFile,
  getFileContent,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");

const router = express.Router();

router.post("/upload", upload.single("image"), uploadFile);
router.get("/", listFiles);
router.get("/:id", getFile);
router.get("/:id/content", getFileContent);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);

module.exports = router;
