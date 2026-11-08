// controllers/visitorController.js
// Public tracking endpoints. These must never crash the server and must
// never store a raw IP address, a password, precise GPS, or a fingerprint.
//
// Privacy rules enforced here:
// - If the client says doNotTrack is true, we store nothing (204 response).
// - visitorId / sessionId are pseudonymous IDs created in the browser
//   AFTER consent. Without consent the client should not send them, and
//   we still accept the request but store it without an identifier.
// - country / city are approximate fields supplied by the client/provider.
//   We never read req.ip and never store it.
// - screenResolution is stored only if the client says it was consented to.
const { dbConnected } = require("../config/db");
const { parseDevice } = require("../utils/deviceParser");
const Visitor = require("../models/Visitor");
const PageView = require("../models/PageView");

function isDoNotTrack(req, body) {
  return body.doNotTrack === true || req.headers.dnt === "1";
}

// Shared helper: build the safe, minimal fields for a visit/pageview.
function buildFields(req, body) {
  const { browser, os, device } = parseDevice(body.userAgent || req.headers["user-agent"]);
  return {
    visitorId: String(body.visitorId || ""),
    sessionId: String(body.sessionId || ""),
    page: String(body.page || body.path || "/").slice(0, 200),
    referrer: String(body.referrer || "").slice(0, 500),
    browser,
    os,
    device,
    country: String(body.country || "").slice(0, 100),
    city: String(body.city || "").slice(0, 100),
    // Only keep screen resolution if the visitor consented to it.
    screenResolution: body.consented ? String(body.screenResolution || "") : "",
  };
}

// POST /api/analytics/visit
// Records one visit (one session start). A refresh is NOT a new visit:
// the frontend only sends this once per session.
async function recordVisit(req, res, next) {
  try {
    if (isDoNotTrack(req, req.body)) {
      return res.status(204).end(); // respect Do Not Track: store nothing
    }
    const f = buildFields(req, req.body);
    if (!dbConnected()) {
      return res.json({ success: true, stored: false, reason: "database not connected" });
    }
    if (!f.visitorId) {
      return res.status(400).json({ success: false, message: "visitorId is required" });
    }
    // Upsert the visitor: same visitorId = same visitor, new session.
    // $inc sessionCount by 1 only if this is a new sessionId — the
    // frontend sends a new sessionId after 30 minutes of inactivity.
    await Visitor.findOneAndUpdate(
      { visitorId: f.visitorId },
      {
        $set: { lastSeenAt: new Date(), browser: f.browser, os: f.os, device: f.device, country: f.country, city: f.city, referrer: f.referrer },
        $setOnInsert: { firstSeenAt: new Date(), sessionCount: 0, pageViewCount: 0 },
        $inc: { sessionCount: 1 },
      },
      { upsert: true, new: true }
    );
    return res.status(201).json({ success: true, stored: true });
  } catch (err) {
    return next(err);
  }
}

// POST /api/analytics/pageview
// Records one page view. Every load counts, including a refresh.
async function recordPageView(req, res, next) {
  try {
    if (isDoNotTrack(req, req.body)) {
      return res.status(204).end();
    }
    const f = buildFields(req, req.body);
    if (!dbConnected()) {
      return res.json({ success: true, stored: false, reason: "database not connected" });
    }
    if (!f.visitorId || !f.sessionId) {
      return res.status(400).json({ success: false, message: "visitorId and sessionId are required" });
    }
    await PageView.create({ ...f, visitedAt: new Date() });
    await Visitor.findOneAndUpdate(
      { visitorId: f.visitorId },
      { $inc: { pageViewCount: 1 }, $set: { lastSeenAt: new Date() } }
    );
    return res.status(201).json({ success: true, stored: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { recordVisit, recordPageView };
