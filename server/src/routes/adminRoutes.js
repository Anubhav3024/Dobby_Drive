const express = require("express");
const { recomputeSizes } = require("../controllers/adminController");

const router = express.Router();

router.post("/recompute-sizes", recomputeSizes);

module.exports = router;
