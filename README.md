# Dobby Drive Storage

A Google Drive-style web app where users can sign up, create nested folders, and upload images into folders. Each folder shows its **total size**, including all nested subfolders.

## What this project does

- Authenticated users can:
  - Create folders inside folders (unlimited nesting)
  - Upload **image files only** into a folder (with a required display name)
  - View folder sizes aggregated across descendants
  - Download or delete uploaded images
- Data is **isolated per user** (users only see what they uploaded/created)

## Tech stack

**Frontend**

- React 18 + Vite
- React Router
- TanStack Query
- Axios

**Backend**

- Node.js (>= 18) + Express
- MongoDB + Mongoose
- Auth: JWT + httpOnly cookies (bcrypt password hashing)
- Security middleware: Helmet, CORS, express-mongo-sanitize, rate limiting
- File uploads: Multer (local disk storage)
- API docs: Swagger UI (OpenAPI)

## Repository structure

```
.
├─ client/                  # React (Vite) app
│  ├─ src/
│  │  ├─ api/               # API clients (auth/folders/files)
│  │  ├─ components/        # UI components
│  │  ├─ pages/             # Landing, SignIn, SignUp, Dashboard
│  │  ├─ providers/         # AuthProvider, ToastProvider
│  │  └─ utils/             # helpers (tree building, formatting)
│  └─ package.json
├─ server/                  # Node/Express API
│  ├─ src/
│  │  ├─ config/            # env + db connection
│  │  ├─ controllers/       # auth, folder, file, mcp, admin
│  │  ├─ middleware/        # auth, upload, validation, errors, rate limits
│  │  ├─ models/            # User, Folder, File
│  │  ├─ routes/            # /auth, /folders, /files, /mcp, /admin, /health
│  │  ├─ services/          # size + storage helpers
│  │  └─ docs/              # openapi.json
│  ├─ uploads/              # local uploaded files (gitignored)
│  └─ package.json
└─ README.md
```

## System design (how it works)

### Data model

- **User**
  - `name`, `email`, `passwordHash`
- **Folder**
  - `userId` (owner)
  - `name`
  - `parentFolderId` (nullable)
  - `path` (array of ancestor folder IDs, including itself)
  - `directSize` (bytes of files directly inside this folder)
  - `aggregatedSize` (bytes of files inside this folder **and all descendants**)
- **File**
  - `userId` (owner)
  - `folderId`
  - `name` (display name)
  - `originalName`, `storedName`, `mimeType`, `size`
  - served via `/api/files/:id/content`

### Folder size strategy

On each upload/delete, the API updates sizes incrementally:

- `directSize` is updated for the file’s immediate folder
- `aggregatedSize` is updated for **every folder in the folder’s `path`**

This makes folder-size reads fast (no expensive recursive sum on every request).

An admin-only endpoint exists to recompute everything from scratch (useful if data was migrated or manually edited).

### Security & access control

- Auth is required for all folder/file/MCP routes.
- Queries always include `userId`, ensuring user isolation.
- Uploads accept **images only** and enforce a maximum size.
- Basic hardening is enabled via Helmet, MongoDB operator sanitization, and rate limiting on auth routes.

## Functional workflow (end-to-end)

1. **Landing** → user chooses to continue to sign in
2. **Sign up / Sign in**
   - Server creates a JWT and stores it in an **httpOnly cookie**
   - Client checks session with `GET /api/auth/me`
3. **Dashboard**
   - Loads the folder tree (`GET /api/folders/tree`)
   - Lists child folders (`GET /api/folders?parentFolderId=...`)
   - Lists files (`GET /api/files?folderId=...`)
4. **Create nested folder**
   - Client posts `{ name, parentFolderId }` → server creates folder and sets its `path`
5. **Upload image**
   - Client uploads `multipart/form-data` with `folderId`, `name`, and `image`
   - Server stores the file in `server/uploads/`, creates a File document, and adjusts folder sizes
6. **View / download / delete**
   - Images are displayed using `/api/files/:id/content`
   - Download uses `/api/files/:id/download`
   - Delete removes both DB record and local file, and decrements folder sizes

## API

Swagger UI:

- `http://localhost:4000/api/docs`

Key routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET  /api/folders` (by `parentFolderId`)
- `GET  /api/folders/tree`
- `POST /api/folders`
- `POST /api/files/upload`
- `GET  /api/files` (by `folderId`)
- `GET  /api/files/:id/content`
- `GET  /api/files/:id/download`
- `DELETE /api/files/:id`

## MCP tools (optional bonus)

This project exposes a small MCP-compatible interface under `/api/mcp` (auth required):

- `GET /api/mcp/tools` — list available tools and JSON schemas
- `POST /api/mcp/invoke` — invoke a tool

Example invoke body:

```json
{
  "tool": "create_folder",
  "arguments": { "name": "Projects", "parentFolderId": null }
}
```

## Local development

### Prerequisites

- Node.js **18+**
- MongoDB (local or remote)

### 1) Configure environment

Copy example env files:

- `server/.env.example` → `server/.env`
- `client/.env.example` → `client/.env`

Important server env vars:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — required
- `CLIENT_URL` / `CLIENT_URLS` — allowed frontend origins (comma-separated)
- `UPLOAD_DIR` — defaults to `uploads`
- `MAX_FILE_SIZE_MB` — upload limit
- `ADMIN_RECOMPUTE_KEY` — required only for the admin recompute endpoint

### 2) Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### 3) Run both dev servers

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

- Frontend: Vite default `http://localhost:5173`
- API: `http://localhost:4000/api`

## Demo data / credentials (for submission)

Option A (recommended): sign up via the UI at `/signup`.

Option B: create a demo user:

```bash
cd server
node scripts/seed-demo-user.js
```

Then sign in with:

- Email: `demo@dobby.local`
- Password: `Password123!`

(You can override these by setting `DEMO_EMAIL`, `DEMO_PASSWORD`, and `DEMO_NAME` when running the script.)

Option C: seed a full demo folder tree + images:

```bash
cd server
node scripts/seed-demo-data.js
# re-create demo data:
node scripts/seed-demo-data.js --reset
```

## Deployment notes

In development, the frontend and backend run as **two separate servers**.

For production, you can either:

- Deploy **client** and **server** separately (recommended) and set `CLIENT_URLS` + `VITE_API_URL`, or
- Add a production setup where the server also serves the built frontend (not currently wired in this repo).

## Git hygiene

- `.env*`, uploads, and local scratch cookie/tmp files are gitignored.
- Do not commit real credentials or cookies.
