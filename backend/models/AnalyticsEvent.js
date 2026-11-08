// models/AnalyticsEvent.js
// One document per app event, e.g. a GitHub search or a repo click.
// We store only the GitHub username / repo name and the outcome —
// never the identity of the person who searched.
//
// Allowed event types:
//   search, search_success, search_failed, repo_view, favourite_add
const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["search", "search_success", "search_failed", "repo_view", "favourite_add"],
      index: true,
    },
    // GitHub username that was searched, or repo name that was viewed.
    // Empty for events that have no username/repo.
    username: { type: String, default: "" },
    repo: { type: String, default: "" },
    // Pseudonymous visitorId, if consent was given. Empty otherwise.
    visitorId: { type: String, default: "" },
    sessionId: { type: String, default: "" },
    page: { type: String, default: "/" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Same retention rule as PageView: raw events expire after 90 days.
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
