// routes/analyticsRoutes.js
// Two groups in one file:
// 1. Public event endpoint: POST /api/analytics/event (rate-limited)
// 2. Protected admin endpoints: GET /api/admin/analytics/*
//    Every admin route below has authMiddleware applied directly, so
//    mounting this router at /api/admin/analytics protects them all.
//    The public /event route is mounted separately in server.js.
const express = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

const eventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Public: record a search / repo_view / favourite_add event.
// (Exported as a named handler so server.js can mount it at /api/analytics/event.)
const recordEvent = [eventLimiter, analyticsController.recordEvent];

// Protected admin analytics (mounted under /api/admin/analytics in server.js).
router.get("/overview", authMiddleware, analyticsController.overview);
router.get("/visitors", authMiddleware, analyticsController.visitors);
router.get("/pageviews", authMiddleware, analyticsController.pageviews);
router.get("/devices", authMiddleware, analyticsController.devices);
router.get("/browsers", authMiddleware, analyticsController.browsers);
router.get("/countries", authMiddleware, analyticsController.countries);
router.get("/referrers", authMiddleware, analyticsController.referrers);
router.get("/events", authMiddleware, analyticsController.events);

module.exports = router;
module.exports.recordEvent = recordEvent;
