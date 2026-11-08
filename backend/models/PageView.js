// models/PageView.js
// One document per page view (every page load, including a refresh).
// No raw IP address is stored anywhere in this model.
//
// DATA RETENTION: detailed page views expire automatically after 90 days.
// The TTL index below deletes old documents; daily totals are kept by
// aggregation in services/analyticsService.js, so the dashboard still
// works after old raw rows are gone.
const mongoose = require("mongoose");

const pageViewSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    // e.g. "/" or "/admin.html" — pathname only, never a full URL with secrets.
    page: { type: String, default: "/" },
    referrer: { type: String, default: "" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, enum: ["mobile", "desktop", "tablet"], default: "desktop" },
    // Approximate country/city only, supplied by the client or a provider.
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    // Screen resolution, only when the visitor consented (e.g. "1920x1080").
    screenResolution: { type: String, default: "" },
    // When this page view happened.
    visitedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB deletes a document 90 days after its createdAt.
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("PageView", pageViewSchema);
