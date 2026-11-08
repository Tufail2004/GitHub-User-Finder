// server.js
// Entry point for the GitHub User Finder backend.
// Order matters in Express: security headers -> CORS -> JSON parsing ->
// cookies -> routes -> 404 -> error handler.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/db");
const { errorMiddleware, notFound } = require("./middleware/errorMiddleware");
const visitorRoutes = require("./routes/visitorRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Helmet sets safe HTTP headers (e.g. no sniffing, XSS protection).
app.use(helmet());
// CORS: allow the local frontend (file:// and localhost) to call the API.
// In production, restrict origin to your real frontend domain.
app.use(cors({ origin: true, credentials: true }));
// Parse JSON request bodies, e.g. { "visitorId": "...", "page": "/" }.
app.use(express.json());
app.use(cookieParser());

// Health check — always works, even without a database.
app.get("/", (req, res) => {
  res.json({ success: true, message: "GitHub User Finder API is running" });
});

// Public visitor tracking.
app.use("/api/analytics", visitorRoutes);
// Public event tracking (POST /api/analytics/event).
app.post("/api/analytics/event", analyticsRoutes.recordEvent);
// Protected admin analytics: GET /api/admin/analytics/*
app.use("/api/admin/analytics", analyticsRoutes);
// Admin auth: POST /api/admin/login, /logout, GET /api/admin/me
app.use("/api/admin", authRoutes);
// GitHub proxy (secondary): GET /api/users/:username and /repos
app.use("/api/users", userRoutes);

// 404 for unknown routes, then the central error handler (must be last).
app.use(notFound);
app.use(errorMiddleware);

// Connect to MongoDB if configured, but start the server either way.
// connectDB() logs a warning instead of crashing when there is no DB.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
