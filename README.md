# PitchCraft

Turn a single word or idea into a complete, investor-ready startup pitch — powered by Google's Gemini AI, React, and Firebase.

## Stack

- **Client:** React 19 + Vite + MUI, Firebase Auth + Firestore
- **Server:** Express (calls the Gemini API, keeps your API key off the client)
- **Optional:** Firebase Cloud Functions as an alternative to the Express server

## Project structure

```
pitchCraft/
├── src/                  # React app
│   ├── components/       # AuthForm, ProtectedRoute, ErrorBoundary
│   ├── context/          # AuthContext (Firebase auth state), ToastContext
│   ├── pages/             # Login, Signup, Dashboard, NotFound
│   ├── utils/             # apiClient (axios), user.js, authErrors.js
│   └── firebase.js
├── server/                # Express backend that talks to Gemini
├── functions/              # Optional: same backend as a Firebase Cloud Function
├── firestore.rules        # Security rules — each user can only read/write their own data
└── firebase.json
```

## 1. Prerequisites

- Node.js 20+
- A Firebase project with **Authentication (Email/Password)** and **Firestore** enabled
- A Gemini API key from https://aistudio.google.com/apikey

> **If you're setting this up from a zip I sent you:** the original project had a Gemini API key hardcoded in the source and committed to git. If you haven't already, **revoke that key now** at the link above and generate a new one — never reuse it.

## 2. Client setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase web config (find it in Firebase Console → Project Settings → General → Your apps) and the URL of your backend:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:5000
```

Note: Firebase's client-side config values aren't secret by design (they identify your project, not authorize access) — real access control lives in `firestore.rules`. It's still good practice to keep them in `.env` so different environments can point at different projects.

Run it:

```bash
npm run dev
```

## 3. Server setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:

```
GEMINI_API_KEY=your-key-here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Run it:

```bash
npm start
```

The server exposes `POST /api/generate`, accepting `{ message }` as JSON, or `multipart/form-data` with `message` + an optional `file` (PNG/JPEG/WEBP/PDF, max 10MB). It has basic per-IP rate limiting (15 requests/minute) to protect your Gemini quota and bill — tune `RATE_LIMIT_MAX_REQUESTS` in `server/server.js` for your needs, or swap it for a Redis-backed limiter if you're running multiple server instances.

## 4. Firestore security rules

Deploy the included rules so users can only read/write their own data:

```bash
firebase deploy --only firestore:rules
```

(Requires `firebase-tools`: `npm install -g firebase-tools`, then `firebase login` and `firebase use --add` to link this folder to your Firebase project.)

Without these rules, Firestore falls back to whatever mode it was created in — often locked-down-by-default, which is safe but breaks the app, or "test mode," which is wide open. Deploy the rules either way so it's explicit.

## 5. Deployment

**Client:** any static host works — Vercel, Netlify, or Firebase Hosting (`firebase deploy --only hosting` after `npm run build`, config is already in `firebase.json`).

**Server:** deploy `server/` to Render, Railway, Fly.io, or similar. Set `GEMINI_API_KEY` and `CLIENT_ORIGIN` as environment variables in that platform's dashboard — never commit them. Point your client's `VITE_API_BASE_URL` at the deployed server URL.

**Alternative:** deploy `functions/` as a Firebase Cloud Function instead of running your own server (see comments at the top of `functions/index.js`).

## Security notes

- Real secrets (Gemini API key) live only in `server/.env` / your hosting platform's env vars — never in client code, never committed.
- Firestore access is scoped per-user via `firestore.rules`, not just by hiding data in the UI.
- The server validates and rate-limits requests; it doesn't trust the client blindly.
- If you ever `git log` this repo and see a real API key in the history, treat that key as compromised and rotate it — removing it from a future commit doesn't erase it from history.

## Known limitations / good next steps

- Rate limiting is in-memory and per-server-instance — fine for a single small deployment, not for autoscaling.
- No automated tests yet.
- No per-user usage caps on Gemini calls beyond the IP rate limit — consider tracking usage per Firebase user if you open this up publicly.
