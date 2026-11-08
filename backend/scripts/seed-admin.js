// scripts/seed-admin.js
// Creates (or updates) the ONE admin account from .env values.
// Usage:  npm run seed:admin
// Reads ADMIN_EMAIL / ADMIN_PASSWORD from .env, hashes the password
// with bcryptjs, and upserts it into the Admin collection.
// There is no public admin registration route — this script is the
// only way to create an admin. Never hardcode a password here.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  const uri = process.env.MONGODB_URI || "";

  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  await mongoose.connect(uri);
  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.findOneAndUpdate(
    { email },
    { email, passwordHash },
    { upsert: true, new: true }
  );
  console.log(`Admin ready: ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
