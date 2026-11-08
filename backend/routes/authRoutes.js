// routes/authRoutes.js — admin authentication.
// Login is strictly rate limited: max 10 attempts per 15 minutes per IP,
// to slow down password guessing. There is NO registration route here.
const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
