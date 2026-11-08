// middleware/authMiddleware.js
// Protects admin routes. The admin JWT is stored in a secure HTTP-only
// cookie called "admin_token" (set on login). We also accept an
// Authorization: Bearer <token> header, which is handy for Postman testing.
//
// If there is no token, or it is invalid/expired: 401 Unauthorized.
// If it is valid: req.admin = { id, email } and the request continues.
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token =
    req.cookies?.admin_token ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized. Please log in as admin." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
  }
}

module.exports = authMiddleware;
