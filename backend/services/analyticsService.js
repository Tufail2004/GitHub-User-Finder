// services/analyticsService.js
// All the counting / grouping logic for the admin dashboard lives here,
// so the controllers stay thin. Every function returns plain data, or
// zeros when there is no database / no data yet (graceful degradation).
const { dbConnected } = require("../config/db");
const Visitor = require("../models/Visitor");
const PageView = require("../models/PageView");
const AnalyticsEvent = require("../models/AnalyticsEvent");

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function emptyOverview() {
  return {
    totalVisitors: 0,
    uniqueVisitors: 0,
    totalPageViews: 0,
    todayVisitors: 0,
    yesterdayVisitors: 0,
    last7DaysVisitors: 0,
    last30DaysVisitors: 0,
    monthlyVisitors: 0,
    returningVisitors: 0,
  };
}

// Overview cards: totals + today / yesterday / 7d / 30d / monthly + returning.
// "Returning" = a visitorId with sessionCount > 1 (seen in >1 session).
async function getOverview() {
  if (!dbConnected()) return emptyOverview();
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = startOfDay(addDays(now, -1));
  const last7 = startOfDay(addDays(now, -6));
  const last30 = startOfDay(addDays(now, -29));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalVisitors, totalPageViews, todayVisitors, yesterdayVisitors,
    last7Visitors, last30Visitors, monthlyVisitors, returningVisitors] =
    await Promise.all([
      Visitor.countDocuments(),
      PageView.countDocuments(),
      Visitor.countDocuments({ lastSeenAt: { $gte: today } }),
      Visitor.countDocuments({ lastSeenAt: { $gte: yesterday, $lt: today } }),
      Visitor.countDocuments({ lastSeenAt: { $gte: last7 } }),
      Visitor.countDocuments({ lastSeenAt: { $gte: last30 } }),
      Visitor.countDocuments({ lastSeenAt: { $gte: monthStart } }),
      Visitor.countDocuments({ sessionCount: { $gt: 1 } }),
    ]);

  return {
    totalVisitors,
    uniqueVisitors: totalVisitors, // one Visitor document = one unique visitor
    totalPageViews,
    todayVisitors,
    yesterdayVisitors,
    last7DaysVisitors: last7Visitors,
    last30DaysVisitors: last30Visitors,
    monthlyVisitors,
    returningVisitors,
  };
}

// Daily page-view counts for charts. Returns [{ date: "2026-11-08", count: 3 }]
async function getDailyVisitors(days = 30) {
  if (!dbConnected()) return [];
  const from = startOfDay(addDays(new Date(), -(days - 1)));
  const rows = await PageView.aggregate([
    { $match: { visitedAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, count: r.count }));
}

// Generic breakdown: group PageViews by one field, e.g. device/browser/country.
async function getBreakdown(field, limit = 10) {
  if (!dbConnected()) return [];
  const rows = await PageView.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ name: r._id || "Unknown", count: r.count }));
}

// Top referrers, ignoring empty referrers (direct visits).
async function getTopReferrers(limit = 10) {
  if (!dbConnected()) return [];
  const rows = await PageView.aggregate([
    { $match: { referrer: { $ne: "" } } },
    { $group: { _id: "$referrer", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ name: r._id, count: r.count }));
}

// Paginated visitor list, newest first, with optional ?from&to date filters.
async function getVisitors({ from, to, page = 1, limit = 20 }) {
  if (!dbConnected()) return { visitors: [], total: 0, page, limit, totalPages: 0 };
  const filter = {};
  if (from || to) {
    filter.lastSeenAt = {};
    if (from) filter.lastSeenAt.$gte = new Date(from);
    if (to) filter.lastSeenAt.$lte = new Date(to);
  }
  const skip = (page - 1) * limit;
  const [visitors, total] = await Promise.all([
    Visitor.find(filter).sort({ lastSeenAt: -1 }).skip(skip).limit(limit).lean(),
    Visitor.countDocuments(filter),
  ]);
  // Never expose anything sensitive: these documents contain no IP anyway.
  return { visitors, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getEvents({ page = 1, limit = 20 } = {}) {
  if (!dbConnected()) return { events: [], total: 0, page, limit, totalPages: 0 };
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    AnalyticsEvent.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AnalyticsEvent.countDocuments(),
  ]);
  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

module.exports = {
  getOverview,
  getDailyVisitors,
  getBreakdown,
  getTopReferrers,
  getVisitors,
  getEvents,
  emptyOverview,
};
