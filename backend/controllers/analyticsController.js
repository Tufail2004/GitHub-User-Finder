// controllers/analyticsController.js
// Public event endpoint + protected admin analytics endpoints.
// Event endpoint: POST /api/analytics/event
// Admin endpoints (all behind authMiddleware in the routes file):
//   GET /api/admin/analytics/overview, /visitors, /pageviews,
//       /devices, /browsers, /countries, /referrers, /events
const { dbConnected } = require("../config/db");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const analyticsService = require("../services/analyticsService");

const ALLOWED_EVENT_TYPES = ["search", "search_success", "search_failed", "repo_view", "favourite_add"];

// POST /api/analytics/event — public, rate-limited in the routes file.
// Stores only the GitHub username / repo name and the outcome.
async function recordEvent(req, res, next) {
  try {
    if (req.body.doNotTrack === true || req.headers.dnt === "1") {
      return res.status(204).end();
    }
    const { type, username = "", repo = "", visitorId = "", sessionId = "", page = "/" } = req.body;
    if (!ALLOWED_EVENT_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid event type" });
    }
    if (!dbConnected()) {
      return res.json({ success: true, stored: false, reason: "database not connected" });
    }
    await AnalyticsEvent.create({ type, username: String(username).slice(0, 100), repo: String(repo).slice(0, 200), visitorId: String(visitorId), sessionId: String(sessionId), page: String(page).slice(0, 200) });
    return res.status(201).json({ success: true, stored: true });
  } catch (err) {
    return next(err);
  }
}

async function overview(req, res, next) {
  try {
    const data = await analyticsService.getOverview();
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

async function visitors(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const data = await analyticsService.getVisitors({ from: req.query.from, to: req.query.to, page, limit });
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

// Daily page-view counts for the daily/weekly/monthly charts.
// ?days=7 (default 30)
async function pageviews(req, res, next) {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));
    const data = await analyticsService.getDailyVisitors(days);
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

async function devices(req, res, next) {
  try {
    return res.json({ success: true, data: await analyticsService.getBreakdown("device") });
  } catch (err) { return next(err); }
}
async function browsers(req, res, next) {
  try {
    return res.json({ success: true, data: await analyticsService.getBreakdown("browser") });
  } catch (err) { return next(err); }
}
async function countries(req, res, next) {
  try {
    return res.json({ success: true, data: await analyticsService.getBreakdown("country") });
  } catch (err) { return next(err); }
}
async function referrers(req, res, next) {
  try {
    return res.json({ success: true, data: await analyticsService.getTopReferrers() });
  } catch (err) { return next(err); }
}
async function events(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const data = await analyticsService.getEvents({ page, limit });
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

module.exports = { recordEvent, overview, visitors, pageviews, devices, browsers, countries, referrers, events };
