# GitHub User Finder 🔍

A simple and responsive web application that allows users to search for GitHub profiles using the GitHub REST API. Enter a GitHub username to instantly view the user's profile information.

This project has been upgraded into a full-stack application with a privacy-first **Visitor Tracking and Analytics System** and a separate **Admin Dashboard**.

## ✨ Features

### GitHub User Finder (original, preserved)
- 🔎 Search GitHub users by username
- 👤 Display user profile information
- 🖼️ Show profile image
- 📄 Display bio and account details
- 📍 Show location (if available)
- 👥 Followers & Following count
- 📦 Public repositories count
- 🔗 Direct link to GitHub profile
- 📱 Responsive design
- ⚡ Fast and easy to use

### Visitor Analytics (new)
- Privacy-friendly visit, page-view and event tracking — only after consent
- Pseudonymous visitor IDs (no raw IP addresses stored, no fingerprinting)
- Total / unique / today's / yesterday's / last 7 days / last 30 days / monthly visitors
- Returning visitors, most visited pages, top referrers
- Browser, operating system, device and approximate country statistics
- GitHub search events: search, search_success, search_failed, repo_view, favourite_add
- Detailed page views and events expire automatically after 90 days (TTL index)

### Admin Dashboard (new)
- Separate admin login (JWT in a secure HTTP-only cookie, bcryptjs password hashing)
- No public admin registration route — admin is created only by `npm run seed:admin`
- Statistics cards, Chart.js charts (daily / device / browser / country / referrers)
- Visitor table with date filters and pagination

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js (admin dashboard only)
- **Backend:** Node.js, Express.js, Axios
- **Database:** MongoDB Atlas, Mongoose
- **Authentication:** JWT, bcryptjs
- **Security:** dotenv, Helmet, express-rate-limit, HTTP-only cookies
- **Tools:** Postman, Git and GitHub, Nodemon

## 📂 Project Structure

```
GitHub-User-Finder/
├── index.html          # Original finder UI (preserved) + consent banner
├── style.css           # Original styles (preserved) + consent banner styles
├── script.js           # Original search logic (unchanged)
├── analytics.js        # NEW: consent banner + visit/pageview/event tracking
├── admin.html          # NEW: Admin Dashboard page
├── admin.js            # NEW: Admin Dashboard logic (Chart.js)
├── admin.css           # NEW: Admin Dashboard styles
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── visitorController.js
│   │   ├── authController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── Visitor.js
│   │   ├── PageView.js
│   │   ├── Admin.js
│   │   └── AnalyticsEvent.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── visitorRoutes.js
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── services/analyticsService.js
│   ├── utils/deviceParser.js
│   ├── scripts/seed-admin.js
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js
│   └── package.json
└── README.md
```

### Definitions used in this project
- **Page view** = every page load (a refresh IS a new page view)
- **Session** = a group of page views; 30 minutes of inactivity = a new session
- **Unique visitor** = the same pseudonymous visitorId seen over a period (a refresh is NOT a new unique visitor)

## 🚀 Installation

```bash
git clone https://github.com/Tufail2004/GitHub-User-Finder.git
cd GitHub-User-Finder/backend
npm install
cp .env.example .env
# Edit .env with your own MongoDB Atlas URI, JWT secret and admin details
npm run dev
```

The backend runs at `http://localhost:5000`. Open `index.html` in a browser (or serve the project root with a static server) and open `admin.html` for the dashboard.

Create the admin account (requires a MongoDB connection):

```bash
npm run seed:admin
```

## 🔐 Environment Variables

Copy `backend/.env.example` to `backend/.env`. Never commit `.env` and never paste real secrets in the README or in GitHub issues.

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/github-user-finder
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-to-a-strong-password
```

## 📡 API Documentation

### Health
- `GET /` — `{ "success": true, "message": "GitHub User Finder API is running" }`

### Visitor Tracking (public, rate-limited)
- `POST /api/analytics/visit` — body: `{ visitorId, sessionId, page, referrer, userAgent, country, city, screenResolution, consented, doNotTrack }`
- `POST /api/analytics/pageview` — same body as `/visit`
- `POST /api/analytics/event` — body: `{ type, username, repo, visitorId, sessionId, page }`, where `type` is one of `search`, `search_success`, `search_failed`, `repo_view`, `favourite_add`

Without a database, tracking endpoints still return `{ "success": true, "stored": false, "reason": "database not connected" }` instead of crashing.

### GitHub (public, via backend)
- `GET /api/users/:username` — GitHub profile (404 for unknown user, 429 for GitHub rate limit)
- `GET /api/users/:username/repos?page=1&per_page=6`

### Admin Authentication
- `POST /api/admin/login` — body: `{ email, password }`, sets an HTTP-only `admin_token` cookie. Rate-limited to 10 attempts per 15 minutes.
- `POST /api/admin/logout` — clears the cookie
- `GET /api/admin/me` — protected, returns the logged-in admin

### Admin Analytics (all protected — require the admin cookie / Bearer token)
- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/visitors?from=2026-11-01&to=2026-11-08&page=1&limit=20`
- `GET /api/admin/analytics/pageviews?days=30`
- `GET /api/admin/analytics/devices`
- `GET /api/admin/analytics/browsers`
- `GET /api/admin/analytics/countries`
- `GET /api/admin/analytics/referrers`
- `GET /api/admin/analytics/events?page=1&limit=20`

## 🔒 Privacy & Security

- No raw IP addresses are stored. IP-based geolocation, if used, is processed transiently and only approximate country/city are kept.
- No passwords, personal files, precise GPS, sensitive personal information, fingerprints or hidden device identifiers are collected.
- Tracking starts only after consent (except respecting Do Not Track, which disables tracking entirely).
- Admin routes are protected by JWT. Passwords are hashed with bcryptjs. Secrets live in `.env` only.
- Detailed page views and events are deleted automatically after 90 days.

## 📸 Screenshots

<!-- Add screenshots here, e.g. ![Home page](screenshots/home.png) -->
- Home page: _to be added_
- Admin dashboard: _to be added_

## 🌐 Deployment

- Backend: deploy `backend/` to a Node.js host (for example Render / Railway), set the environment variables there, and set `NODE_ENV=production` so the admin cookie is `Secure`.
- Frontend: serve the project root as static files, and update `API_BASE` in `analytics.js` and `admin.js` to your deployed backend URL.
- Database: MongoDB Atlas, with the connection string in `MONGODB_URI` only.

## 📚 What I Learned

- Working with REST APIs, Fetch API, async/await, DOM manipulation, error handling, responsive design
- Building an Express backend: routes, controllers, middleware, services and models (MVC)
- MongoDB + Mongoose, JWT authentication, bcryptjs password hashing
- Privacy-first analytics: consent, pseudonymous IDs, sessions, aggregation, data retention

## 👨‍💻 Author

**Tufail Ahmed**

- GitHub: https://github.com/Tufail2004
