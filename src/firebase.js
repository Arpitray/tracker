// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Load config from Vite environment variables (do not commit secrets)
// Create a `.env.local` file with VITE_FB_* values (see README or earlier instructions)
const envConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

function hasAllEnv(cfg) {
  return cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId;
}

let firebaseConfig = envConfig;
if (!hasAllEnv(envConfig)) {
  // When developing locally, fall back to the previously provided hard-coded config
  // so the developer can run the app without immediate env setup. This is a deliberate
  // convenience — in production you should set VITE_FB_* env vars and remove the fallback.
  if (import.meta.env.DEV) {
    console.warn('[firebase] VITE_FB_* env vars are missing or incomplete — using development fallback. Create .env.local to silence this.');
    firebaseConfig = {
      apiKey: 'AIzaSyA7V4HLAJvqySjmCdoCzz3nb9EIW8TieqM',
      authDomain: 'tracker-ec511.firebaseapp.com',
      projectId: 'tracker-ec511',
      storageBucket: 'tracker-ec511.appspot.com',
      messagingSenderId: '740519244775',
      appId: '1:740519244775:web:a616a0fb098d804b32c342',
      measurementId: 'G-NW99F4W705',
    };
  } else {
    throw new Error('[firebase] Missing VITE_FB_* env vars. Set them in .env.local for Vite.');
  }
}

const app = initializeApp(firebaseConfig);

// Analytics may not be available in all environments (e.g. during SSR)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (err) {
  // ignore in non-browser environments or if analytics disabled
}

export { app, analytics };
