// controllers/userController.js
// Optional GitHub proxy routes (secondary to analytics):
//   GET /api/users/:username
//   GET /api/users/:username/repos
// The backend calls GitHub with Axios, so a future GitHub token can be
// kept on the server and never exposed in frontend JavaScript.
// Rate-limit handling: 404 = unknown user, 403/429 = GitHub rate limit.
const axios = require("axios");

const github = axios.create({
  baseURL: "https://api.github.com",
  headers: { Accept: "application/vnd.github+json" },
  timeout: 10000,
});

function handleGitHubError(err, res) {
  const status = err.response?.status;
  if (status === 404) return res.status(404).json({ success: false, message: "GitHub user not found" });
  if (status === 403 || status === 429) {
    return res.status(429).json({ success: false, message: "GitHub API rate limit reached. Please try again later." });
  }
  return res.status(502).json({ success: false, message: "GitHub API error" });
}

async function getUser(req, res) {
  try {
    const { data } = await github.get(`/users/${encodeURIComponent(req.params.username)}`);
    return res.json({ success: true, data });
  } catch (err) {
    return handleGitHubError(err, res);
  }
}

async function getUserRepos(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = Math.min(100, parseInt(req.query.per_page, 10) || 6);
    const { data } = await github.get(`/users/${encodeURIComponent(req.params.username)}/repos`, {
      params: { page, per_page: perPage, sort: "updated" },
    });
    return res.json({ success: true, data });
  } catch (err) {
    return handleGitHubError(err, res);
  }
}

module.exports = { getUser, getUserRepos };
