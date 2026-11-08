// routes/visitorRoutes.js — public tracking routes.
// Rate limited: max 300 tracking requests per 15 minutes per IP.
// (Rate limiting uses the IP only in memory to count requests —
//  the IP is never stored in the database.)
const express = require("express");
const rateLimit = require("express-rate-limit");
const { recordVisit, recordPageView } = require("../controllers/visitorController");

const router = express.Router();

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many tracking requests. Please try again later." },
});

router.use(trackingLimiter);
router.post("/visit", recordVisit);
router.post("/pageview", recordPageView);

module.exports = router;
