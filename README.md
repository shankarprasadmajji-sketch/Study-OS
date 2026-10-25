# StudyOS — A Smart Study Operating System for Students

> **“Your syllabus. Your schedule. Your progress.”**

StudyOS is a full-stack, responsive academic operating system engineered specifically for college and university students. It bridges the gap between static course syllabi and real, executable daily study schedules through a deterministic multi-factor scheduling engine, automated missed-session recovery, distraction-free focus modes, and visual progress analytics.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Quick Start & Installation](#quick-start--installation)
7. [Environment Configuration](#environment-configuration)
8. [Connecting MongoDB](#connecting-mongodb)
9. [Running the Application](#running-the-application)
10. [API Route Summary](#api-route-summary)
11. [Deterministic Scheduling Engine](#deterministic-scheduling-engine)
12. [Missed-Session Recovery Workflow](#missed-session-recovery-workflow)
13. [Testing Instructions](#testing-instructions)
14. [Production Build & Deployment](#production-build--deployment)
15. [Security Architecture](#security-architecture)
16. [Known Platform Limitations](#known-platform-limitations)

---

## 1. Project Overview

College students often face significant hurdles:
- **Daily decision fatigue:** Wondering what to study every morning.
- **Multi-course juggling:** Balancing multiple heavy course syllabi and overlapping midterm dates.
- **Schedule fragility:** Missing a single day of studying causes rigid static plans to collapse into last-minute cramming.
- **Topic prerequisites:** Tackling advanced concepts before foundational modules are mastered.

StudyOS solves this by decomposing courses into discrete syllabus topics, measuring estimated study minutes, tracking dependencies, and scheduling study sessions strictly within your designated availability windows.

---

## 2. Key Features

- **Deterministic Scheduling Engine:** Transparent priority scoring balancing exam urgency, topic difficulty, importance weight, and revision needs without arbitrary randomness.
- **Automated Missed-Session Recovery:** Reallocates unfinished study blocks into valid future study slots without double-booking or pushing everything naively to "tomorrow".
- **Syllabus & Course Breakdown:** Track courses, codes, examination dates, and chapter progression with real-time completion percentages.
- **Daily Study Sheet & Timetable:** Clean day and week views showing chronologically ordered study blocks, one-click completion, and manual reschedule modals.
- **Distraction-Free Focus Mode:** Built-in Pomodoro (25m), Deep Work (50m), and break interval timers tied directly to syllabus topics with automatic progress logging.
- **Visual Analytics:** Interactive Recharts graphs comparing planned vs. actual minutes studied over the last 7 days, topic status distributions, and exam countdowns.
- **MongoDB ODM Ready with Graceful Demo Fallback:** Native Mongoose schemas and models ready to connect to any MongoDB cluster. When unconfigured, boots in interactive Demo Mode with sample university data and honest UI badges.
- **Dark & Light Modes:** Tailored color tokens with persistence and system-preference support.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite
- **Styling:** Vanilla CSS + Tailwind CSS (with bespoke design tokens & dark mode)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form + Zod
- **Data Visualization:** Recharts
- **Date Utilities:** date-fns

### Backend
- **Runtime:** Node.js (v20+ / v22+)
- **Server:** Express.js with TypeScript
- **Database:** MongoDB
- **ODM:** Mongoose v8
- **Validation:** Zod schema validation
- **Authentication:** JWT (Access & Refresh tokens) + HttpOnly secure cookies + bcryptjs password hashing
- **Security:** Helmet, CORS, and Express Rate Limiting

### Testing
- **Backend & Scheduling Engine:** Vitest + Supertest (13 integration & unit tests)
- **Frontend UI:** Vitest + React Testing Library + JSDOM (5 component tests)

---

## 4. Folder Structure

```
studyos/
├── package.json              # Workspace root runner (dev, build, test)
├── .gitignore                # Git ignore rules for node_modules, dist, .env
├── README.md                 # Master documentation
├── server/                   # Backend Express & MongoDB API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example          # Server environment templates
│   ├── .env                  # Local server environment configuration
│   └── src/
│       ├── app.ts            # Express application factory & middleware
│       ├── server.ts         # Server entrypoint and DB lifecycle
│       ├── config/
│       │   ├── database.ts   # Dedicated MongoDB Mongoose connection manager
│       │   └── env.ts        # Environment variable loader
│       ├── models/           # Mongoose Data Models
│       │   ├── User.ts
│       │   ├── Subject.ts
│       │   ├── Topic.ts
│       │   ├── Availability.ts
│       │   ├── StudyPlan.ts
│       │   ├── StudySession.ts
│       │   ├── TopicProgress.ts
│       │   ├── Reminder.ts
│       │   └── RefreshToken.ts
│       ├── services/
│       │   ├── scheduler.ts  # Deterministic scheduling algorithm
│       │   ├── recovery.ts   # Missed-session recovery service
│       │   └── dataStore.ts  # Unified repository (MongoDB Mongoose + Demo Store)
│       ├── middleware/
│       │   ├── auth.ts       # JWT Bearer & cookie authentication guard
│       │   ├── validate.ts   # Zod request validator
│       │   └── errorHandler.ts # Centralized safe error handler
│       ├── controllers/      # REST endpoint controllers
│       ├── routes/           # Express router endpoints
│       └── tests/            # Vitest & Supertest test suite
│           ├── api.test.ts
│           └── scheduler.test.ts
└── client/                   # Frontend React & Vite Application
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example          # Client environment template
    ├── .env                  # Client Vite environment variables
    └── src/
        ├── main.tsx          # React DOM entrypoint
        ├── App.tsx           # Route tree (public & protected routes)
        ├── api/client.ts     # Centralized fetch API client
        ├── context/
        │   ├── AuthContext.tsx  # Authentication and user state
        │   └── ThemeContext.tsx # Light/dark theme provider
        ├── types/index.ts    # Shared TypeScript interfaces
        ├── styles/index.css  # Tailwind base & CSS theme variables
        ├── components/
        │   ├── layout/       # AppLayout, Sidebar, Header, DatabaseBadge
        │   └── ui/           # Button, Card, Badge, Modal, EmptyState
        ├── pages/
        │   ├── public/       # LandingPage, Login, Signup, Forgot, Reset
        │   ├── app/          # Dashboard, Onboarding, Subjects, Topics, Timetable, StudyPlan, Progress, Focus, Settings
        │   └── NotFoundPage.tsx
        └── tests/            # React Testing Library test suite
            ├── setup.ts
            └── ui.test.tsx
```

---

## 5. Prerequisites

- **Node.js:** v18.0.0 or higher (v22 LTS recommended)
- **npm:** v9.0.0 or higher
- **MongoDB:** (Optional for Demo Mode, required for persistent production database). Either a local MongoDB instance (`mongodb://localhost:27017/studyos`) or MongoDB Atlas URI (`mongodb+srv://...`).

---

## 6. Quick Start & Installation

Clone or open the repository in your terminal and install dependencies:

```bash
# Install root dependencies
npm install

# Install server and client dependencies
npm run install:all
```

Or install them individually:
```bash
cd server && npm install
cd ../client && npm install
```

---

## 7. Environment Configuration

### Server Environment (`server/.env`)
Copy `server/.env.example` to `server/.env`:

```env
PORT=5000
NODE_ENV=development
# Supply your MongoDB connection string below
MONGODB_URI=
JWT_ACCESS_SECRET=studyos_jwt_access_super_secret_key_2026_dev
JWT_REFRESH_SECRET=studyos_jwt_refresh_super_secret_key_2026_dev
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
EMAIL_FROM=noreply@studyos.local
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Client Environment (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 8. Connecting MongoDB

StudyOS features a dedicated MongoDB database connection module in `server/src/config/database.ts`.

1. Obtain your MongoDB connection string (e.g. from MongoDB Atlas or local MongoDB community server).
2. Open `server/.env`.
3. Set `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/studyos?retryWrites=true&w=majority
   ```
4. Restart the backend server.
5. The application will log:
   ```
   [Database] Successfully connected to MongoDB database "studyos" on host "cluster0...".
   ```
6. The frontend header badge will immediately switch from amber (**Demo Mode**) to green (**MongoDB: Connected**).
7. If `MONGODB_URI` is empty, the application starts gracefully in Demo Mode with pre-populated realistic data, clearly displaying that it is operating in demo mode without claiming false database connectivity.

---

## 9. Running the Application

### Option A: Simultaneous Workspace Runner
From the root directory:
```bash
npm run dev
```

### Option B: Run in Separate Terminals

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend React App):**
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

Open your browser at **http://localhost:5173** to access StudyOS!

### Demo Credentials
To immediately explore the populated dashboard without creating a new account:
- **Email:** `alex.rivera@university.edu`
- **Password:** `DemoStudent123!`
- Or simply click **"One-Click Demo Student Login"** on the Login page.

---

## 10. API Route Summary

All REST endpoints are namespaced under `/api/v1`.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health & MongoDB connection status | No |
| `POST` | `/api/v1/auth/register` | Register new student account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user & return session | No |
| `POST` | `/api/v1/auth/logout` | Invalidate token and clear cookies | No |
| `GET` | `/api/v1/auth/me` | Fetch active user profile | **Yes** |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | No |
| `POST` | `/api/v1/auth/forgot-password`| Request password reset | No |
| `POST` | `/api/v1/auth/reset-password` | Set new password with token | No |
| `GET` | `/api/v1/profile` | Get student profile & preferences | **Yes** |
| `PATCH` | `/api/v1/profile` | Update profile fields | **Yes** |
| `PATCH` | `/api/v1/profile/onboarding` | Complete multi-step onboarding | **Yes** |
| `GET` | `/api/v1/subjects` | List user's courses with stats | **Yes** |
| `POST` | `/api/v1/subjects` | Create a new subject | **Yes** |
| `GET` | `/api/v1/subjects/:id` | Get subject details + its topics | **Yes** |
| `PATCH` | `/api/v1/subjects/:id` | Update subject details | **Yes** |
| `DELETE` | `/api/v1/subjects/:id` | Delete subject & cascade topics | **Yes** |
| `GET` | `/api/v1/topics` | List topics with search & filters | **Yes** |
| `POST` | `/api/v1/topics` | Add topic with duration & difficulty | **Yes** |
| `PATCH` | `/api/v1/topics/:id` | Update topic status or estimates | **Yes** |
| `DELETE` | `/api/v1/topics/:id` | Remove topic | **Yes** |
| `GET` | `/api/v1/availability` | Fetch weekly study windows | **Yes** |
| `PUT` | `/api/v1/availability` | Update complete weekly availability | **Yes** |
| `GET` | `/api/v1/study-plans` | Fetch active study plan & sessions | **Yes** |
| `POST` | `/api/v1/study-plans/generate` | Run deterministic scheduling engine | **Yes** |
| `POST` | `/api/v1/study-plans/:id/recover` | Recover missed sessions | **Yes** |
| `GET` | `/api/v1/study-sessions` | List sessions with date filters | **Yes** |
| `GET` | `/api/v1/study-sessions/today` | Fetch today's study sheet | **Yes** |
| `POST` | `/api/v1/study-sessions/:id/complete` | Mark session completed & log time | **Yes** |
| `POST` | `/api/v1/study-sessions/:id/miss` | Mark session missed | **Yes** |
| `POST` | `/api/v1/study-sessions/:id/reschedule`| Manually reschedule session | **Yes** |
| `GET` | `/api/v1/progress/summary` | Overall completion & weekly trend | **Yes** |
| `GET` | `/api/v1/progress/subjects`| Course-by-course breakdown | **Yes** |
| `GET` | `/api/v1/progress/history` | Historical completed sessions | **Yes** |

---

## 11. Deterministic Scheduling Engine

The engine is encapsulated in `server/src/services/scheduler.ts` and operates independently of controllers and databases:

$$Priority = 0.40 \times Urgency + 0.25 \times Difficulty + 0.20 \times Importance + 0.15 \times RevisionNeed$$

- **Urgency:** Normalized based on days remaining until the course examination date.
- **Difficulty:** `easy` = 0.33, `medium` = 0.66, `hard` = 1.0.
- **Importance:** Normalized from course and topic ratings (1 to 5).
- **Prerequisite Validation:** Uses cycle detection (DFS) to resolve topic dependencies and schedules foundation topics before advanced modules.
- **Availability Window Slotting:** Slices user-defined daily study hours into digestible blocks (default 50 mins + 10 min break).
- **Feasibility Assessment:** Honest reporting of capacity shortfalls or unscheduled topics if total workload exceeds available hours before an exam.

---

## 12. Missed-Session Recovery Workflow

When life happens and a session is missed:
1. The session is marked `status: 'missed'` preserving historical integrity.
2. The Recovery Engine (`server/src/services/recovery.ts`) scans future availability windows between tomorrow and the exam date.
3. It detects collision-free slots that do not conflict with already scheduled upcoming sessions.
4. It presents a reallocation proposal with exact dates, times, and feasibility feedback.
5. Upon student confirmation, the new sessions are scheduled on the timetable.

---

## 13. Testing Instructions

StudyOS includes comprehensive test coverage across both backend API endpoints, the scheduling algorithm, and frontend UI components.

Run all tests from the root directory:
```bash
npm test
```

### Running Server Tests Only
```bash
cd server
npm test
# Executes 13 tests (7 scheduler tests, 6 API integration tests)
```

### Running Client Tests Only
```bash
cd client
npm test
# Executes 5 React Testing Library UI component & page tests
```

---

## 14. Production Build & Deployment

### Build Command
Compile both TypeScript bundles:
```bash
npm run build
```

This generates:
- `server/dist/`: Production CommonJS/ESM Node build.
- `client/dist/`: Optimized Vite production static bundle.

### Production Execution
```bash
cd server
npm start
```

### Production Checklist
1. Provide a production MongoDB Atlas URI in `MONGODB_URI`.
2. Generate strong secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
3. Set `COOKIE_SECURE=true` and `NODE_ENV=production`.
4. Deploy the frontend to Vercel/Netlify/S3 and point `CLIENT_URL` to your production domain.
5. Deploy the backend behind HTTPS / reverse proxy (Nginx or Cloudflare).

---

## 15. Security Architecture

- **Ownership Enforcement:** Every private database read, update, or deletion query explicitly filters by `userId: req.user.userId`. A student can never view or modify another student's courses or sessions.
- **Password Protection:** Plaintext passwords are never saved. Salted hashes are generated using `bcryptjs` (cost 10). Password hashes are set to `select: false` in Mongoose to prevent accidental exposure.
- **Protected Routing:** Unauthenticated requests are rejected on the backend with `401 Unauthorized` and redirected on the frontend via `ProtectedRoute`.
- **Injection & Tampering Protection:** Zod strictly sanitizes and validates incoming payloads. Allowlist sanitization prevents unauthorized field mutation during profile updates.
- **Rate Limiting:** Authentication routes are protected by `express-rate-limit` against brute-force attacks.

---

## 16. Known Platform Limitations

- **System-Wide Application Blocking:** A standard browser web application operates in a secure browser sandbox. It cannot close third-party native desktop programs (such as Instagram or YouTube) on your computer. For system-wide blocking, combine StudyOS with native OS screen-time limits or a companion browser extension.
- **Email Delivery:** When `SMTP_HOST` is unconfigured, password recovery operates in simulated mode without throwing fatal errors. Production email dispatch requires standard SMTP credentials.

---

## License

MIT License. Built with ❤️ for college and university students worldwide.
