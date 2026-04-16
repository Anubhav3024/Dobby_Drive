const express = require("express");
const auth = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { signupSchema, loginSchema } = require("../validators/authSchemas");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", validateBody(signupSchema), authController.signup);
router.post("/login", validateBody(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", auth, authController.me);

module.exports = router;
