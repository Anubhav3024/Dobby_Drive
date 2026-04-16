const express = require("express");
const mcpController = require("../controllers/mcpController");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/tools", mcpController.listTools);
router.post("/invoke", mcpController.invokeTool);

module.exports = router;
