// utils/deviceParser.js
// Turns a browser user-agent string into simple, human-readable fields.
// No fingerprinting: we only read the user-agent the browser already sends
// with every request, and we do not try to identify a specific person.
//
// Returns: { browser, os, device }
//   browser: "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera" | "Unknown"
//   os: "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "Unknown"
//   device: "mobile" | "tablet" | "desktop"
function parseDevice(userAgent = "") {
  const ua = String(userAgent || "");

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let device = "desktop";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = "tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(ua)) device = "mobile";

  return { browser, os, device };
}

module.exports = { parseDevice };
