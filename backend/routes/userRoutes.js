// routes/userRoutes.js — GitHub proxy routes (secondary to analytics).
//   GET /api/users/:username
//   GET /api/users/:username/repos?page=1&per_page=6
const express = require("express");
const { getUser, getUserRepos } = require("../controllers/userController");

const router = express.Router();

router.get("/:username/repos", getUserRepos);
router.get("/:username", getUser);

module.exports = router;
