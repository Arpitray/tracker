# Tracker — Habit tracker (React + Vite + Firebase)

A small habit-tracking frontend built with React and Vite that uses Firebase Authentication and Cloud Firestore for persistence and real-time sync.

This README explains how the frontend and backend fit together, how to run the project locally, environment variables, deployment to Vercel, and troubleshooting notes specific to real-time sync patterns used in the app.

## What this project contains
- Frontend: React (v19) + Vite. UI components live under `src/components/` and the main app entry points are `src/main.jsx` and `src/App.jsx`.
- Styling: Tailwind CSS (configured in the project).
- Backend (BaaS): Firebase Authentication + Firestore. Client helpers live in `src/lib/firebaseClient_Enhanced.jsx` and `src/firebase.js`.

## High-level architecture

Frontend
- React functional components + hooks. Key components include `LandingPage.jsx`, `UserDashboard.jsx`, `HabitCard.jsx`, and auth screens under `components/`.
- Local optimistic state: when creating a new habit the UI creates a temporary (numeric) id locally and displays the card immediately. The app then persists the card to Firestore and reconciles the saved document when the realtime listener reports it.
- To avoid duplicate UI items from the realtime listener and optimistic updates, the code uses short-lived in-memory sets like `pendingSavedIds` and `pendingOperations` to mark recently-saved/deleted items and deduplicate listener updates.

Backend (Firebase)
- Authentication: Firebase Auth handles sign-up, login, and user identity.
- Persistence: Cloud Firestore stores habit documents per user in a collection (see `src/lib/firebaseClient_Enhanced.jsx` for collection paths and helpers).
- Realtime sync: the app subscribes to Firestore snapshots to get live updates (adds/edits/deletes) and merges that data with local optimistic state.

Design notes
- Firestore is treated as the persistent source-of-truth. Local temporary records are reconciled with Firestore snapshots.
- Auto-save behavior was intentionally removed to prevent accidental blank "Untitled" habits from being stored.

## Prerequisites
- Node.js (16+ recommended, Node 18+ preferred)
- npm (or yarn)
- A Firebase project and service credentials (Web app config)

## Environment variables
Create a `.env` file or set environment variables in your host (Vercel). Example placeholders are provided in `.env.example`.

Required variables (prefixed with VITE_ so Vite exposes them to the client):
- `VITE_FB_API_KEY`
- `VITE_FB_AUTH_DOMAIN`
- `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET` (optional for storage features)
- `VITE_FB_MESSAGING_SENDER_ID` (optional)
- `VITE_FB_APP_ID`

## Local development
From the project root open a PowerShell terminal and run:

```powershell
# install deps
npm install

# start dev server with HMR
npm run dev
```

The app will serve on a local Vite URL (typically `http://localhost:5173`). Hot module reload applies when editing files.

## Important scripts (in `package.json`)
- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle into `dist`
- `npm run vercel-build` — same as `build` (added for Vercel)
- `npm run preview` — locally preview the production build
- `npm run lint` — run ESLint checks

## How data flows (save/updates/deletes)
1. Create new card: UI creates a local temporary card (numeric id) and inserts it at the top of the list. The user can edit and explicitly save.
2. Save card: the client posts to Firestore. After Firestore responds with a document id the client replaces the temporary card with the persisted doc (and marks the saved id in `pendingSavedIds` briefly to avoid the realtime listener re-inserting it).
3. Realtime listener: listens to the user's cards collection and provides live adds/edits/deletes. The listener merges Firestore docs with any remaining local temporary cards and uses dedupe rules.
4. Delete: delete operations mark the id in `pendingOperations` so the listener won't reintroduce the deleted doc for a short window.

If you edit code related to this syncing logic, run the dev server and watch the console logs — the app contains logging around save/listener boundaries to help debug races.

## Deployment (Vercel)
This project includes `vercel.json` and an example `.env.example`. Steps to deploy:

1. Create a new Vercel project and connect the repository.
2. Set the Environment Variables in Vercel (the `VITE_FB_*` values from your Firebase console).
3. Use the default build command (or set it explicitly): `npm run vercel-build` and output directory `dist`.
4. Deploy. The app is a static SPA and `vercel.json` has a fallback route to `index.html`.

## Troubleshooting
- Duplicate/flash on save: if you see a brief duplicate when saving a new habit (temporary card + saved card), open DevTools and watch the console for the save/listener logs. Check `pendingSavedIds` logic in `src/LandingPage.jsx` — it prevents immediate re-add by the listener. If a flash persists, try saving slower or report console traces.
- "Untitled Habit" auto-saves: auto-save was deliberately removed. If you see blank items being saved, check for any leftover auto-save effect or a third-party extension.
- Lost progress on refresh: ensure you are authenticated and that Firestore rules allow reads/writes for the signed-in user. Also confirm `VITE_FB_PROJECT_ID` and other config values are correct.

## Contributing
- Fork the repo, make changes on a feature branch, and open a pull request. Describe the problem and include reproduction steps for sync issues (steps to create, save, and observe the listener behavior).

## Where to look in the code
- `src/LandingPage.jsx` — main dashboard & syncing logic (add/save/delete, listener, dedupe)
- `src/lib/firebaseClient_Enhanced.jsx` — Firestore helpers and persistence functions
- `src/components/` — UI components (habits, auth, settings)

## License & credits
This repository does not currently include a license file. Add a `LICENSE` if you want to publish under an open-source license.

---

If you want, I can also add a short Troubleshooting section that prints the exact console trace to capture when you reproduce the "save flash" so I can tune the timing/dedup logic further.
