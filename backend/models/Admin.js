// models/Admin.js
// The admin account. There is NO public registration route for admins.
// An admin is created only by scripts/seed-admin.js, which reads
// ADMIN_EMAIL / ADMIN_PASSWORD from .env, hashes the password with
// bcryptjs, and saves it here. Passwords are never stored in plain text.
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash of the password, never the password itself.
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
