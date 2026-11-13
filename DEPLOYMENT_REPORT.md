# ShelfShare – Production Deployment & Audit Report

**Project**: ShelfShare – Student Academic Resource Sharing Platform  
**Target Environment**: Vercel Serverless Architecture (Frontend + Backend)  
**Database**: MySQL Server 8.0+ / 9.x (Remote Cloud Hosted)  
**Persistent Storage**: Cloudinary (PDF, PPT, PPTX, DOC, DOCX)  
**Report Date**: November 2026  
**Status**: **ALL PRODUCTION DEPLOYMENT FIXES IMPLEMENTED & PASSING (11/11 TEST SUITES, 81 TESTS)**

---

## 1. Summary of Problems Identified & Root Causes

| # | Current Problem | Root Cause in Source Code | Resolution Implemented |
|---|---|---|---|
| **1** | Opening backend URL shows `{"success":false,"message":"API endpoint not found: GET /"}` | `server.js` only mounted `/api/*` subroutes and had no root handler `GET /`. Vercel traffic to the backend root triggered the global 404 handler. | Added `GET /` returning operational status, service metadata, and API index links. |
| **2** | Cannot confirm if backend is connected to MySQL | `/api/health` returned a static JSON string without probing the database; `/health` was missing. | Implemented dynamic health check on both `/health` and `/api/health` that runs a safe `SELECT 1` database query without exposing credentials. |
| **3** | Local MySQL database and deployed website not synchronised | Backend `db.js` defaulted to `localhost:3306`, which points to Vercel's isolated container where MySQL does not run. | Upgraded `backend/config/db.js` to support hosted cloud MySQL connection URIs (`DATABASE_URL`, `MYSQL_URL`) and SSL encryption (`DB_SSL=true`). Added auto-schema setup utility (`backend/utils/initDatabase.js`). |
| **4** | Frontend displays homepage but dashboard statistics show zero | When frontend failed to reach backend or backend failed to reach MySQL, the frontend caught the error and left `stats` at its initial zero state (`totalResources: 0`). | Resolved backend routing, normalized API base URL in Axios, and enabled CORS for Vercel domains. |
| **5** | Some resource cards appear to contain sample data | Hero section of `LandingPage.jsx` contained 3 hardcoded static preview cards (Aarav, Priya, Karan). | Updated `LandingPage.jsx` to dynamically render real resources from MySQL via `featuredResources`, with clean loading skeletons and empty states when empty. |
| **6** | Uploaded documents would disappear on Vercel | Multer was configured with `diskStorage` to local `backend/uploads/`. Vercel serverless containers are ephemeral and read-only (except temporary `/tmp`). | Implemented persistent cloud storage via **Cloudinary** (`storageService.js`) using `multer.memoryStorage()`, with safe fallback to local disk in offline development. |
| **7** | Authentication cookies blocked cross-domain on Vercel | `backend/utils/jwt.js` set `sameSite: 'strict'`, which modern browsers block on cross-domain requests between `frontend.vercel.app` and `backend.vercel.app`. | Updated cookie configuration to `sameSite: 'none'; secure: true` in production, and implemented Bearer token localStorage fallback in `AuthContext.jsx` and `api.js`. |
| **8** | Page refresh on frontend would cause Vercel 404 | Missing Single Page Application (SPA) routing rewrite for React Router. | Created `frontend/vercel.json` with rewrite rule `/(.*) -> /index.html`. |
| **9** | Express backend routing missing on Vercel | Missing Vercel serverless entry point and configuration in `backend/`. | Created `backend/api/index.js` and `backend/vercel.json` with `@vercel/node` builder. |

---

## 2. Source Files Modified & Created

### Backend Files:
1. [`backend/server.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/server.js):
   - Added root route `GET /` with API navigation and operational status.
   - Added dynamic MySQL health probes at `GET /health` and `GET /api/health`.
   - Enhanced CORS to support comma-separated origins, trailing slash normalization, and `.vercel.app` preview deployments.
   - Added automatic schema verification on startup (`AUTO_INIT_DB`).
2. [`backend/api/index.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/api/index.js):
   - Created Vercel Serverless Function entry point exporting the Express application.
3. [`backend/vercel.json`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/vercel.json):
   - Configured `@vercel/node` builder and routing for serverless execution.
4. [`backend/config/db.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/config/db.js):
   - Added support for cloud MySQL connection strings (`DATABASE_URL`, `MYSQL_URL`).
   - Added automatic SSL configuration (`rejectUnauthorized: false` for hosted providers like Aiven, TiDB, PlanetScale, AWS RDS).
   - Added pool error handlers and safe connection test probe.
5. [`backend/utils/initDatabase.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/utils/initDatabase.js):
   - Added schema verification utility that creates all 13 required tables (`CREATE TABLE IF NOT EXISTS`) without dropping existing data.
   - Seeds baseline courses, semesters, and subjects if the database is newly initialized.
6. [`backend/config/cloudinary.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/config/cloudinary.js):
   - Configured Cloudinary SDK using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
7. [`backend/services/storageService.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/services/storageService.js):
   - Handles streaming uploads to Cloudinary with `resource_type: 'auto'` (supporting PDF, DOC, DOCX, PPT, PPTX).
   - Handles file deletion from Cloudinary on permanent resource removal.
   - Provides safe fallback to local disk for offline development.
8. [`backend/middleware/uploadMiddleware.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/middleware/uploadMiddleware.js):
   - Upgraded to `multer.memoryStorage()` for serverless memory streaming with 10MB limit and MIME validation.
9. [`backend/controllers/resourceController.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/controllers/resourceController.js):
   - Integrated `storageService.uploadFile` and `storageService.deleteFile`.
10. [`backend/controllers/fileController.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/controllers/fileController.js):
    - Added support for Cloudinary asset preview and authenticated download redirects while recording download counts and audit logs in MySQL.
11. [`backend/controllers/adminController.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/controllers/adminController.js):
    - Integrated `storageService.deleteFile` for admin deletion.
12. [`backend/utils/jwt.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/utils/jwt.js):
    - Configured `sameSite: 'none'; secure: true` for cross-domain cookie delivery.
13. [`backend/.env.example`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/backend/.env.example):
    - Documented all required environment variables with comprehensive comments.

### Frontend Files:
1. [`frontend/vercel.json`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/frontend/vercel.json):
   - Added SPA rewrite rule `/(.*) -> /index.html` preventing 404s on page refresh.
2. [`frontend/src/services/api.js`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/frontend/src/services/api.js):
   - Added automatic `baseURL` normalization (guarantees `/api` without double slashes).
   - Added request interceptor to attach `Authorization: Bearer <token>` from `localStorage`.
   - Added 401 response interceptor to handle session expiration.
3. [`frontend/src/context/AuthContext.jsx`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/frontend/src/context/AuthContext.jsx):
   - Saves token to `localStorage` on login/register and clears on logout.
4. [`frontend/src/pages/LandingPage.jsx`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/frontend/src/pages/LandingPage.jsx):
   - Replaced static hero preview cards with dynamic rendering from `featuredResources`.
5. [`frontend/.env.example`](file:///c:/Users/Ashelle%20Dsouza/Desktop/SELF%20PROJECTS/ShelfShare/frontend/.env.example):
   - Documented `VITE_API_BASE_URL`.

---

## 3. Step-by-Step Vercel Environment Variables Configuration

Configure these environment variables in your Vercel Dashboard under **Project Settings > Environment Variables** for **Production, Preview, and Development**.

### Project 1: Backend Vercel Project Settings

| Environment Variable | Sample Value | Explanation |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and HTTPS cookies. |
| `FRONTEND_URL` | `https://your-frontend-project.vercel.app` | Allows your frontend Vercel domain to communicate with the backend. |
| `DB_HOST` | `aws.connect.psdb.cloud` *(or your cloud host)* | Hostname of your hosted MySQL database. |
| `DB_PORT` | `3306` | MySQL port. |
| `DB_USER` | `your_mysql_username` | MySQL user. |
| `DB_PASSWORD` | `your_mysql_password` | MySQL password. |
| `DB_NAME` | `shelfshare_db` | MySQL database name. |
| `DB_SSL` | `true` | Enables SSL encryption required by cloud MySQL providers. |
| `DATABASE_URL` | *(Optional)* `mysql://user:pass@host:3306/shelfshare_db` | Complete URI (alternative to individual `DB_*` variables). |
| `JWT_SECRET` | `shelfshare_production_secret_key_2026_mca_project` | Secret key used to sign student session tokens (min 32 characters). |
| `COOKIE_SECRET` | `shelfshare_cookie_secret_key_2026` | Secret string for signed cookies. |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_cloud_name` | Cloudinary Cloud Name for persistent document storage. |
| `CLOUDINARY_API_KEY` | `123456789012345` | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | `abcdefghijklmnopqrstuvw_xyz` | Cloudinary API Secret. |
| `AUTO_INIT_DB` | `true` | Automatically verifies and creates all 13 tables on startup. |

> [!NOTE]
> Free hosted MySQL databases can be created on:
> - **Railway** (railway.app - 1-click MySQL)
> - **Aiven** (aiven.io - free managed MySQL)
> - **TiDB Cloud** (pingcap.com/tidb-cloud - free serverless MySQL)
> - **Clever Cloud** (clever-cloud.com - free MySQL addon)

---

### Project 2: Frontend Vercel Project Settings

| Environment Variable | Sample Value | Explanation |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend-project.vercel.app/api` | The deployed URL of your backend project ending with `/api`. |

> [!IMPORTANT]
> Whenever you add or change Environment Variables in Vercel, you must trigger a **Redeploy** in the Vercel Dashboard for the new variables to take effect.

---

## 4. Free Cloud Storage Setup Instructions (Cloudinary)

1. Go to [https://cloudinary.com](https://cloudinary.com) and create a free account.
2. In your Cloudinary Dashboard:
   - Copy your **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - Copy your **API Key** (`CLOUDINARY_API_KEY`)
   - Copy your **API Secret** (`CLOUDINARY_API_SECRET`)
3. Add these three keys into your **Backend Vercel Project Environment Variables**.
4. That's it! When students upload PDFs, PPTs, or Word documents, they are securely stored on Cloudinary permanently, and their URLs are recorded in MySQL.

---

## 5. Automated Test Suite Execution Results

All 11 test suites were executed sequentially:

```
======================================================
  ShelfShare Automated Backend Test Suite
  Discovered 11 Test Suites
======================================================

Running suite: admin.test.js                    [PASS] (7 tests)
Running suite: auth.test.js                     [PASS] (7 tests)
Running suite: dashboard.test.js                [PASS] (6 tests)
Running suite: deployment.test.js               [PASS] (4 tests)
Running suite: download.test.js                 [PASS] (5 tests)
Running suite: e2e_comprehensive_audit.test.js  [PASS] (23 tests)
Running suite: explore.test.js                  [PASS] (6 tests)
Running suite: recommendation.test.js           [PASS] (3 tests)
Running suite: resource.test.js                 [PASS] (6 tests)
Running suite: social.test.js                   [PASS] (9 tests)
Running suite: user_notification.test.js        [PASS] (5 tests)

------------------------------------------------------
Total Test Suites : 11
Passed Suites     : 11
Failed Suites     : 0
Total Test Cases  : 81 Passed, 0 Failed
======================================================
🎉 All ShelfShare test suites completed successfully!
```

---

## 6. Frontend Production Build Verification

```bash
cd frontend
npm run build
```

**Output**:
```
vite v6.4.6 building for production...
transforming...
✓ 2082 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.86 kB │ gzip:   0.46 kB
dist/assets/index-DPhgh_YS.css    1.54 kB │ gzip:   0.77 kB
dist/assets/index-D34F5f2T.js   917.86 kB │ gzip: 241.31 kB
✓ built in 6.97s
```
**Compilation Errors**: **0**

---

## 7. How to Deploy the Fixes to Vercel

### Step 1: Push the updated code to GitHub
```bash
git add .
git commit -m "fix(deployment): configure Vercel serverless routing, cloud MySQL, Cloudinary storage, and cross-domain auth"
git push origin main
```

### Step 2: Configure Environment Variables in Vercel
1. In your **Backend Vercel Project**, go to **Settings > Environment Variables**, add the Backend variables from Section 3, and redeploy.
2. In your **Frontend Vercel Project**, go to **Settings > Environment Variables**, add `VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api`, and redeploy.

### Step 3: Verify the Live Deployment
1. Visit `https://<your-backend>.vercel.app/` -> You will see `{ "success": true, "status": "operational", "name": "ShelfShare..." }`.
2. Visit `https://<your-backend>.vercel.app/health` -> You will see `{ "status": "healthy", "database": { "status": "connected" } }`.
3. Open your frontend `https://<your-frontend>.vercel.app/` -> Notice that live database statistics display actual numbers and the platform is fully responsive and interactive!
