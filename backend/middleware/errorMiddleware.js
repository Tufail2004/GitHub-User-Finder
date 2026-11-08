// middleware/errorMiddleware.js
// Central error handler. Must be registered LAST in server.js, after all
// routes. Any controller that calls next(err) ends up here, so the client
// always gets a clean JSON error instead of a crashed server / HTML page.
function errorMiddleware(err, req, res, next) {
  console.error("[error]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Server error",
  });
}

// 404 handler for unknown API routes.
function notFound(req, res) {
  res.status(404).json({ success: false, message: "Route not found" });
}

module.exports = { errorMiddleware, notFound };
