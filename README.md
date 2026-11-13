# ShelfShare – Student Academic Resource Sharing Platform

> **"Learn. Share. Grow."**  
> A Full-Stack Academic Resource Management and Peer-to-Peer Knowledge Sharing Ecosystem.  
> Master of Computer Applications (MCA) Major Project.

---

## 1. Project Overview

**ShelfShare** is a full-stack academic resource platform built to eliminate the fragmentation of study materials across personal WhatsApp groups, Telegram channels, and chaotic Google Drive folders. 

ShelfShare organizes college study materials by **Course**, **Semester**, **Subject**, and **Unit/Topic**, allowing students to upload, preview, download, rate, review, bookmark, and organize notes into curated collections. The platform incorporates a weighted **Curriculum-Aware Recommendation Engine**, quality scoring indicators, and an **Administrative Governance Suite** for content moderation and curriculum management.

---

## 2. Key Features

### 🎓 Student Learning Experience
- **Interactive Landing Page**: Platform introduction, real-time database statistics (total verified resources, active students, downloads), and interactive workflow cards.
- **Curriculum-Filtered Discovery**: Multi-faceted exploration filtered by Course, Semester, Subject, Resource Type, and Minimum Star Rating. Real-time keyword search across titles, descriptions, units, and tags.
- **Smart Recommendation Engine**: Weighted curriculum affinity formula recommending materials based on current course (+3), semester (+4), interacted subjects (+3), rating multiplier, and download velocity.
- **Quality Indicators**: Automatically calculated badges:
  - 🏆 *High Quality* (Rating ≥ 4.5 and ≥ 3 reviews)
  - 🔥 *Popular* (Download velocity ≥ 10)
  - ⚡ *Curriculum Match* (Matches student's semester/course)
- **Inline PDF Viewer & Secure Downloads**: Sandboxed browser document previewing for PDF files with streaming headers (`Content-Disposition: inline`). Secure file downloading with automatic download counter increments and audit logging.
- **Social Review & Rating System**: 1-to-5 star ratings with student commentary. Atomic recalculation of average ratings and review tallies in MySQL.
- **My Library & Collections**: Custom folder management (e.g., *"Midterm Prep"*, *"Operating Systems Lab Codes"*) with many-to-many resource bundling.
- **Personalized Student Dashboard**: Aggregate statistics (Notes Uploaded, Downloads Made, Bookmarks Saved), dynamic activity feeds, and quick-launch action buttons.
- **Student Profile Management**: Manage university details, update course tracks, change passwords securely with bcrypt verification.
- **Real-Time Notifications**: Unread badges and system alerts for content approvals, community reviews, and moderation updates.

### 🛡️ Administrative Governance Portal
- **Executive Analytics Dashboard**: System metrics (Total Users, Approved Resources, Total Downloads, Pending Reports) accompanied by Recharts interactive visualizations (Upload Trends by Month, Resource Distribution by Type).
- **User Account Management**: Searchable user directory with instant account status toggles (`active`, `suspended`, `inactive`) and role auditing.
- **Content Moderation Console**: Review uploaded materials, inspect file sizes/types, and toggle visibility or delete flagged materials.
- **Community Reports Queue**: Review student reports filed for copyright concerns, duplicate notes, or broken files. Resolve or dismiss reports with admin audit logs.
- **Syllabus & Subject Management**: Configure courses, semesters, subject codes, and curriculum descriptions.

---

## 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Lucide React (Icons), Recharts, Axios, Pure CSS3 |
| **Backend** | Node.js, Express.js (REST API), JWT, bcryptjs, Multer, Helmet, CORS, cookie-parser |
| **Database** | MySQL Server 9.7 (InnoDB), `mysql2/promise` connection pool |
| **Storage** | Dedicated local secure directory (`backend/uploads/`) with cryptographic filename hashing |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert/strict`) — 9 Suites, 54 Automated Tests |

---

## 4. Color Palette & UI Design System

In compliance with modern digital library design standards:
- **Primary Navy**: `#172C40` — Headers, brand marks, primary CTA buttons
- **Secondary Sage Green**: `#A9C9B8` — Badges, accents, highlights
- **Soft Lavender**: `#DCD4F0` — Subtle card tags, secondary banners
- **Warm Off-White**: `#F8F9F7` — App background, layout scaffolding
- **Card Background**: `#FFFFFF` — Rounded surface containers with soft drop shadows
- **Primary Text**: `#252A32` — High-contrast charcoal readability
- **Muted Text**: `#7A8490` — Metadata, captions, timestamps

---

## 5. Security & Engineering Architecture

1. **Password Hashing**: Passwords are salted and hashed using `bcryptjs` with 10 rounds prior to database insertion.
2. **Stateless JWT with HTTP-Only Cookies**: Authentication tokens are transmitted in `SameSite=Lax`, `HttpOnly` cookies (with Authorization header fallback), preventing XSS token theft.
3. **Role-Based Access Control (RBAC)**: Strict backend middleware enforces authorization boundaries. Students attempting to invoke `/api/admin/*` endpoints receive a `403 Forbidden` error with audit logging.
4. **Hardened File Uploads**:
   - Multer validation checks file extensions against permitted types (`.pdf`, `.docx`, `.pptx`, `.doc`, `.ppt`).
   - File size ceiling strictly enforced at **10 MB**.
   - Original file names are stripped and replaced with cryptographically generated UUID timestamps (`res-1731481234567-891011.pdf`).
   - Relative paths prevent Path Traversal attacks (`../`).
5. **No Blind MySQL Storage**: Binary documents reside in `backend/uploads/`; only relative paths and metadata reside in MySQL tables.
6. **SQL Injection Prevention**: 100% of database queries utilize parameterized prepared statements (`pool.query(sql, [params])`).

---

## 6. Database Schema Overview

The database consists of **13 relational tables** with foreign key constraints and indexed search fields:

- `courses`: Academic programs (MCA, BCA, BTECH-CS)
- `semesters`: Semester levels linked to courses
- `subjects`: Syllabus subjects mapped by course and semester
- `users`: Student and administrator accounts
- `resources`: Academic document metadata and relative file paths
- `reviews`: 1-to-5 star student ratings and feedback
- `bookmarks`: Student saved resource bookmarks
- `downloads`: Download audit instances
- `collections`: User-created study sets/folders
- `collection_resources`: Bridge table for many-to-many collection mapping
- `reports`: Flagged content review requests
- `notifications`: User alert notifications
- `admin_activity_logs`: Immutable administrator action logs

*A complete Mermaid ER diagram is available in [docs/DATABASE_ERD.md](docs/DATABASE_ERD.md).*

---

## 7. Demo Credentials

The database comes pre-seeded with complete sample accounts, real PDF/DOCX sample documents, and test reviews:

### Student Account:
- **Email**: `aarav@shelfshare.edu`
- **Password**: `Student@123`
- *Features*: Explore, Upload, Download, Review, Bookmark, Collections, Notifications

### Administrator Account:
- **Email**: `admin@shelfshare.edu`
- **Password**: `Admin@123`
- *Features*: Admin Analytics, User Management, Resource Moderation, Report Resolution, Subject Management

*(Quick-Fill demo buttons are also integrated directly into the `/login` page for seamless evaluator demonstrations).*

---

## 8. Installation & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or later (v24.x tested)
- **npm**: v9.0.0 or later
- **MySQL Server**: v8.0 or v9.x running on port `3306`

---

### Step 1: Database Initialization
1. Start your local MySQL server.
2. Run the database schema script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. Run the database seed script to populate sample courses, subjects, users, and resources:
   ```bash
   mysql -u root -p < database/seed.sql
   ```

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify your environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=1234
   DB_NAME=shelfshare_db
   JWT_SECRET=shelfshare_jwt_super_secret_key_2026_mca_project
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=shelfshare_cookie_secret_key_2026
   ```
4. Generate the sample files in `backend/uploads/`:
   ```bash
   node utils/createSampleFiles.js
   ```
5. Run the automated backend test suite:
   ```bash
   npm test
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will be running at `http://localhost:5000`.*

---

### Step 3: Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will launch at `http://localhost:5173`.*

---

## 9. Automated Testing Suite

The backend includes 9 test suites with **54 automated test cases** covering every functional requirement:

```bash
cd backend
npm test
```

### Test Suite Summary:
1. `auth.test.js`: Registration, unique email enforcement, password hashing, JWT cookies, profile retrieval, password reset.
2. `dashboard.test.js`: Unauthenticated protection (401), user dashboard stats, dynamic activity feeds.
3. `resource.test.js`: Multer file upload, database metadata insertion, owner update permissions, foreign owner modification rejection, safe deletion.
4. `explore.test.js`: Pagination, full-text keyword search, course filtering, sorting algorithms, single resource details.
5. `download.test.js`: Inline PDF streaming, download counter atomic increments, download audit recording.
6. `social.test.js`: Bookmarks management, review submission with atomic rating recalculation, collection CRUD.
7. `recommendation.test.js`: Curriculum-aware recommendation engine ranking and score verification.
8. `admin.test.js`: RBAC checks (403 for students), admin metrics, user status toggles, report moderation.
9. `user_notification.test.js`: User profile aggregate metrics, profile updates, notification unread tracking, mark-as-read flows.

---

## 10. Complete REST API Specification

### Authentication & Academic Routes
- `POST /api/auth/register` — Register student account
- `POST /api/auth/login` — Sign in and issue JWT cookie
- `GET  /api/auth/me` — Verify session and load authenticated user
- `POST /api/auth/logout` — Clear session cookies
- `POST /api/auth/forgot-password` — Generate demo reset code
- `POST /api/auth/reset-password` — Set new password using reset code
- `GET  /api/academic/courses` — List all courses
- `GET  /api/academic/courses/:id/semesters` — List semesters for course
- `GET  /api/academic/semesters/:id/subjects` — List subjects for semester

### Resource & File Operations
- `GET    /api/resources` — Filtered & paginated resource directory
- `POST   /api/resources` — Upload new academic resource with file
- `GET    /api/resources/popular` — Fetch popular materials with badges
- `GET    /api/resources/recommended` — Fetch personalized recommendations
- `GET    /api/resources/my-uploads` — List current student's uploads
- `GET    /api/resources/:id` — Resource details with reviews
- `PUT    /api/resources/:id` — Edit resource metadata (owner only)
- `DELETE /api/resources/:id` — Delete resource and disk file (owner only)
- `GET    /api/resources/:id/preview` — Stream PDF inline for viewer
- `GET    /api/resources/:id/download` — Download document & log counter
- `GET    /api/downloads/history` — Student download history

### Social & Collections
- `GET    /api/bookmarks` — List bookmarked resources
- `POST   /api/bookmarks/:id` — Add bookmark
- `DELETE /api/bookmarks/:id` — Remove bookmark
- `POST   /api/resources/:id/reviews` — Submit 1-5 star review & feedback
- `GET    /api/collections` — List user's study collections
- `POST   /api/collections` — Create new study collection
- `GET    /api/collections/:id` — View collection with contained resources
- `DELETE /api/collections/:id` — Delete study collection
- `POST   /api/collections/:id/resources/:resId` — Add resource to collection
- `DELETE /api/collections/:id/resources/:resId` — Remove resource from collection

### Notifications & Profile
- `GET    /api/notifications` — Fetch user notifications
- `GET    /api/notifications/unread-count` — Count unread alerts
- `PUT    /api/notifications/:id/read` — Mark notification as read
- `PUT    /api/notifications/mark-all-read` — Mark all as read
- `GET    /api/users/profile` — Fetch user profile with aggregated statistics
- `PUT    /api/users/profile` — Update user bio and college
- `PUT    /api/users/change-password` — Change password with verification

### Admin Suite
- `GET    /api/admin/dashboard` — Platform overview metrics
- `GET    /api/admin/analytics` — Recharts time-series data
- `GET    /api/admin/users` — User management directory
- `PUT    /api/admin/users/:id/status` — Toggle user account status
- `GET    /api/admin/resources` — Content moderation directory
- `PUT    /api/admin/resources/:id/status` — Approve/hide/reject resource
- `GET    /api/admin/reports` — Content reports queue
- `PUT    /api/admin/reports/:id` — Resolve or dismiss report
- `GET    /api/admin/subjects` — Subject directory
- `POST   /api/admin/subjects` — Add new subject
- `PUT    /api/admin/subjects/:id` — Update subject
- `DELETE /api/admin/subjects/:id` — Delete subject (with foreign key protection)

---

## 11. Project Directory Structure

```
ShelfShare/
├── backend/
│   ├── config/
│   │   └── db.js                       # MySQL2 connection pool & testConnection
│   ├── controllers/
│   │   ├── academicController.js       # Courses, semesters, subjects endpoints
│   │   ├── adminController.js          # Metrics, analytics, user & resource admin
│   │   ├── authController.js           # Register, login, me, logout, password reset
│   │   ├── bookmarkController.js       # Add, remove, list student bookmarks
│   │   ├── collectionController.js     # Study collection folders CRUD
│   │   ├── dashboardController.js      # Student dashboard stats & feeds
│   │   ├── fileController.js           # PDF preview stream & download logging
│   │   ├── notificationController.js   # Notification alerts and read toggles
│   │   ├── recommendationController.js # Curriculum-affinity ranking engine
│   │   ├── reportController.js         # Community flagging and resolution
│   │   ├── resourceController.js       # Upload, search, filter, edit, delete
│   │   ├── reviewController.js         # Star rating and atomic avg calculation
│   │   └── userController.js           # Profile details and password change
│   ├── middleware/
│   │   ├── authMiddleware.js           # JWT authentication & requireRole RBAC
│   │   └── uploadMiddleware.js         # Multer validation & secure filename hashing
│   ├── routes/                         # Express API route modules
│   ├── tests/                          # 9 Automated Node.js test suites
│   ├── uploads/                        # Dedicated document storage
│   ├── utils/                          # JWT helpers & sample file generator
│   ├── server.js                       # Express application entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                 # Reusable cards, badges, modal wrappers
│   │   │   └── layout/                 # Navbar, Footer, App Layout
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User state, login, logout, role check
│   │   │   └── ToastContext.jsx        # Non-blocking notification toasts
│   │   ├── pages/
│   │   │   ├── admin/                  # Dashboard, Users, Resources, Reports, Subjects
│   │   │   ├── LandingPage.jsx         # Hero, stats, features, how-it-works
│   │   │   ├── LoginPage.jsx           # 1-Click Demo autofill & login
│   │   │   ├── RegisterPage.jsx        # Student registration
│   │   │   ├── ForgotPasswordPage.jsx  # Code-based password reset
│   │   │   ├── StudentDashboard.jsx    # Metrics, feeds, quick actions
│   │   │   ├── ExplorePage.jsx         # Filters, keyword search, sorting
│   │   │   ├── ResourceDetailsPage.jsx # Details, PDF inline viewer, reviews
│   │   │   ├── UploadResourcePage.jsx  # Drag-and-drop upload form
│   │   │   ├── MyUploadsPage.jsx       # Student's uploaded notes
│   │   │   ├── MyDownloadsPage.jsx     # Download history
│   │   │   ├── MyBookmarksPage.jsx     # Saved notes
│   │   │   ├── MyCollectionsPage.jsx   # Curated study folders
│   │   │   ├── NotificationsPage.jsx   # Alert notifications
│   │   │   └── UserProfilePage.jsx     # Academic profile & password change
│   │   ├── routes/                     # ProtectedRoute & AdminRoute guards
│   │   ├── services/api.js             # Axios instance with credentials
│   │   ├── App.jsx                     # Router configuration
│   │   ├── index.css                   # Global CSS design tokens
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── schema.sql                      # 13 relational MySQL tables & constraints
│   └── seed.sql                        # Comprehensive seed data for MCA, BCA, BTech
├── docs/
│   └── DATABASE_ERD.md                 # Complete Mermaid ERD & data dictionary
├── PROJECT_STATUS.md                   # Development phase milestones tracker
└── README.md
```

---

## 12. License & Academic Attribution

Developed for the Master of Computer Applications (MCA) Degree Curriculum.  
Designed and built adhering to professional software engineering standards, clean code architecture, and cybersecurity best practices.
