// models/Visitor.js
// One document per pseudonymous visitor (not per page load).
// visitorId is a random ID created in the browser AFTER consent and stored
// in localStorage. It is not an IP address, not a fingerprint, and it
// cannot identify a real person on its own.
// A refresh does NOT create a new visitor: the same visitorId is reused.
//
// Definitions used everywhere in this project:
// - page view  = every page load (a refresh IS a new page view)
// - session    = a group of page views; 30 minutes of inactivity = new session
// - unique visitor = the same visitorId seen over a period
const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    // Random pseudonymous ID, e.g. "v_9f2c...". Required, unique.
    visitorId: { type: String, required: true, unique: true, index: true },
    // First time we ever saw this visitorId.
    firstSeenAt: { type: Date, default: Date.now },
    // Most recent visit from this visitorId.
    lastSeenAt: { type: Date, default: Date.now },
    // How many separate sessions (visits) this visitor has had.
    sessionCount: { type: Number, default: 1 },
    // How many page views in total from this visitor.
    pageViewCount: { type: Number, default: 0 },
    // Last known browser / OS / device / country (approximate only).
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, enum: ["mobile", "desktop", "tablet"], default: "desktop" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    referrer: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", visitorSchema);
