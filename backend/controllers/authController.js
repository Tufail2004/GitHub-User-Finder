// controllers/authController.js
// Admin login / logout / me. There is NO admin registration route.
// Admins are created only by scripts/seed-admin.js from .env values.
//
// Login flow:
// 1. Find admin by email. 2. Compare password with bcryptjs.
// 3. If correct, sign a JWT and set it in a secure HTTP-only cookie.
//    HTTP-only means frontend JavaScript cannot read the token (safer
//    against XSS). SameSite=Lax, Secure=true in production only
//    (Secure cookies need HTTPS, so local http://localhost testing
//    would break if we forced Secure=true there).
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { dbConnected } = require("../config/db");

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_EXPIRES_IN
    path: "/",
  };
}

// POST /api/admin/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: "Database not connected. Set MONGODB_URI and run npm run seed:admin first." });
    }
    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
    // Same generic message whether the email or the password is wrong,
    // so an attacker cannot tell which one failed.
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(String(password), admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    res.cookie("admin_token", token, cookieOptions());
    return res.json({ success: true, message: "Logged in", admin: { email: admin.email } });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/logout — clears the cookie.
function logout(req, res) {
  res.clearCookie("admin_token", { path: "/" });
  return res.json({ success: true, message: "Logged out" });
}

// GET /api/admin/me — protected. Returns the logged-in admin.
function me(req, res) {
  return res.json({ success: true, admin: req.admin });
}

module.exports = { login, logout, me };
