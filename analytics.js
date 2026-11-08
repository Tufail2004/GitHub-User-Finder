// analytics.js — privacy-first visitor tracking (minimal add-on).
// This file does NOT change search, profile or repo display.
// It only: (1) shows a consent banner, (2) creates a pseudonymous
// visitorId + sessionId in localStorage AFTER consent, (3) sends a
// visit + pageview on load, (4) sends search / repo events.
//
// Definitions:
// - page view = every page load (a refresh IS a new page view)
// - session = grouped views; 30 minutes of inactivity = a new session
// - unique visitor = the same visitorId over a period (a refresh is NOT
//   a new unique visitor)
//
// Privacy: no raw IP, no password, no precise GPS, no fingerprint.
// If Do Not Track is on, or the visitor declines, nothing is sent.
// Screen resolution is sent only after consent.
(function () {
  var API_BASE = "http://localhost:5000/api/analytics";
  var CONSENT_KEY = "guf_consent"; // "accepted" | "declined"
  var VISITOR_KEY = "guf_visitor_id";
  var SESSION_KEY = "guf_session_id";
  var SESSION_TIME_KEY = "guf_session_time";
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  function doNotTrack() {
    return navigator.doNotTrack === "1" || window.doNotTrack === "1";
  }
  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  }
  function newId(prefix) {
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return prefix + "_" + id;
  }
  function getSessionId() {
    var now = Date.now();
    var last = parseInt(localStorage.getItem(SESSION_TIME_KEY) || "0", 10);
    var sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId || now - last > SESSION_TIMEOUT_MS) {
      sessionId = newId("s");
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    localStorage.setItem(SESSION_TIME_KEY, String(now));
    return sessionId;
  }
  function post(path, body) {
    // Fail silently: analytics must never break the search feature.
    return fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(function () {});
  }
  function baseBody() {
    return {
      visitorId: localStorage.getItem(VISITOR_KEY) || "",
      sessionId: getSessionId(),
      page: window.location.pathname || "/",
      referrer: document.referrer || "",
      userAgent: navigator.userAgent,
      country: "",
      city: "",
      screenResolution: window.screen.width + "x" + window.screen.height,
      consented: true,
      doNotTrack: doNotTrack(),
    };
  }
  function sendVisitAndPageview() {
    if (!hasConsent() || doNotTrack()) return;
    if (!localStorage.getItem(VISITOR_KEY)) {
      localStorage.setItem(VISITOR_KEY, newId("v"));
    }
    post("/visit", baseBody());
    post("/pageview", baseBody());
  }
  function sendEvent(type, extra) {
    if (!hasConsent() || doNotTrack()) return;
    post("/event", Object.assign({ type: type }, baseBody(), extra || {}));
  }

  // --- Consent banner ---
  function showBanner() {
    if (doNotTrack()) return; // respect Do Not Track: no banner, no tracking
    if (localStorage.getItem(CONSENT_KEY)) return; // already decided
    var banner = document.getElementById("consent-banner");
    if (!banner) return;
    banner.classList.remove("hidden");
    document.getElementById("consent-accept").addEventListener("click", function () {
      localStorage.setItem(CONSENT_KEY, "accepted");
      banner.classList.add("hidden");
      sendVisitAndPageview();
    });
    document.getElementById("consent-decline").addEventListener("click", function () {
      localStorage.setItem(CONSENT_KEY, "declined");
      banner.classList.add("hidden");
    });
  }

  // --- Hook search + repo clicks WITHOUT changing their behaviour ---
  function hookSearchEvents() {
    var searchBtn = document.getElementById("search-btn");
    var searchInput = document.getElementById("search");
    var profileContainer = document.getElementById("profile-container");
    var errorContainer = document.getElementById("error-container");
    if (!searchBtn || !searchInput) return;

    function onSearch() {
      var username = searchInput.value.trim();
      if (!username) return;
      sendEvent("search", { username: username });
      // The original script shows the profile or the error box.
      // After 1.5s, check which one is visible and report the outcome.
      setTimeout(function () {
        if (profileContainer && !profileContainer.classList.contains("hidden")) {
          sendEvent("search_success", { username: username });
        } else if (errorContainer && !errorContainer.classList.contains("hidden")) {
          sendEvent("search_failed", { username: username });
        }
      }, 1500);
    }
    searchBtn.addEventListener("click", onSearch);
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") onSearch();
    });

    // Repo clicks: delegate from the repos container.
    var reposContainer = document.getElementById("repos-container");
    if (reposContainer) {
      reposContainer.addEventListener("click", function (e) {
        var link = e.target.closest ? e.target.closest(".repo-name") : null;
        if (link) sendEvent("repo_view", { repo: link.textContent.trim() });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    showBanner();
    if (hasConsent()) sendVisitAndPageview();
    hookSearchEvents();
  });
})();
