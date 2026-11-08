// admin.js — Admin Dashboard (private).
// API base: change this to your deployed backend URL in production.
var API_BASE = "http://localhost:5000/api";
var currentPage = 1;

function api(path, options) {
  // credentials: "include" sends the HTTP-only admin_token cookie.
  return fetch(API_BASE + path, Object.assign({ credentials: "include" }, options || {}));
}
function show(id, on) { document.getElementById(id).classList.toggle("hidden", !on); }
function setText(id, value) { document.getElementById(id).textContent = value; }

async function checkLogin() {
  try {
    var res = await api("/admin/me");
    if (res.ok) { show("login-box", false); show("dashboard", true); show("logout-btn", true); loadDashboard(); }
    else { show("login-box", true); show("dashboard", false); show("logout-btn", false); }
  } catch (e) { show("login-box", true); }
}

async function loadDashboard() {
  // Overview cards
  var overview = await (await api("/admin/analytics/overview")).json();
  if (overview.success) {
    var d = overview.data;
    setText("stat-total", d.totalVisitors);
    setText("stat-unique", d.uniqueVisitors);
    setText("stat-views", d.totalPageViews);
    setText("stat-today", d.todayVisitors);
    setText("stat-7d", d.last7DaysVisitors);
    setText("stat-30d", d.last30DaysVisitors);
    setText("stat-returning", d.returningVisitors);
  }
  // Charts
  var daily = await (await api("/admin/analytics/pageviews?days=30")).json();
  if (daily.success && window.Chart) {
    new Chart(document.getElementById("chart-daily"), {
      type: "line",
      data: { labels: daily.data.map(function (r) { return r.date; }), datasets: [{ label: "Page views", data: daily.data.map(function (r) { return r.count; }), borderColor: "#a78bfa" }] },
    });
  }
  drawPie("/admin/analytics/devices", "chart-device", "Devices");
  drawPie("/admin/analytics/browsers", "chart-browser", "Browsers");
  drawPie("/admin/analytics/countries", "chart-country", "Countries");
  drawPie("/admin/analytics/referrers", "chart-referrer", "Referrers");
  loadVisitors();
}

async function drawPie(path, canvasId, label) {
  var res = await (await api(path)).json();
  if (!res.success || !window.Chart) return;
  new Chart(document.getElementById(canvasId), {
    type: "doughnut",
    data: { labels: res.data.map(function (r) { return r.name; }), datasets: [{ label: label, data: res.data.map(function (r) { return r.count; }) }] },
  });
}

async function loadVisitors() {
  var from = document.getElementById("filter-from").value;
  var to = document.getElementById("filter-to").value;
  var q = "?page=" + currentPage + "&limit=20" + (from ? "&from=" + from : "") + (to ? "&to=" + to : "");
  var res = await (await api("/admin/analytics/visitors" + q)).json();
  var tbody = document.getElementById("visitor-rows");
  if (!res.success || !res.data.visitors.length) { tbody.innerHTML = "<tr><td colspan='7'>No visitors yet.</td></tr>"; return; }
  tbody.innerHTML = res.data.visitors.map(function (v) {
    return "<tr><td>" + v.visitorId + "</td><td>" + new Date(v.lastSeenAt).toLocaleString() + "</td><td>" + (v.browser || "") + "</td><td>" + (v.os || "") + "</td><td>" + (v.device || "") + "</td><td>" + (v.country || "") + "</td><td>" + (v.referrer || "") + "</td></tr>";
  }).join("");
  setText("page-info", "Page " + res.data.page + " of " + (res.data.totalPages || 1));
}

document.addEventListener("DOMContentLoaded", function () {
  checkLogin();
  document.getElementById("login-btn").addEventListener("click", async function () {
    var email = document.getElementById("admin-email").value.trim();
    var password = document.getElementById("admin-password").value;
    var res = await api("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) });
    var data = await res.json();
    if (res.ok && data.success) { checkLogin(); }
    else { var el = document.getElementById("login-error"); el.textContent = data.message || "Login failed"; el.classList.remove("hidden"); }
  });
  document.getElementById("logout-btn").addEventListener("click", async function () {
    await api("/admin/logout", { method: "POST" });
    checkLogin();
  });
  document.getElementById("filter-btn").addEventListener("click", function () { currentPage = 1; loadVisitors(); });
  document.getElementById("prev-page").addEventListener("click", function () { if (currentPage > 1) { currentPage--; loadVisitors(); } });
  document.getElementById("next-page").addEventListener("click", function () { currentPage++; loadVisitors(); });
});
