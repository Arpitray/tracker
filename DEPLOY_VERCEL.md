Vercel Deployment Guide

This project is a Vite + React static app. To deploy on Vercel:

1. Connect your GitHub/GitLab/Bitbucket repo to Vercel.
2. Vercel will detect the project as a static site. If it doesn't, set the Build Command and Output Directory manually:

   - Build Command: npm run build
   - Output Directory: dist

3. Set environment variables in the Vercel project settings (Environment Variables):

   - VITE_FB_API_KEY
   - VITE_FB_AUTH_DOMAIN
   - VITE_FB_PROJECT_ID
   - VITE_FB_STORAGE_BUCKET
   - VITE_FB_MESSAGING_SENDER_ID
   - VITE_FB_APP_ID
   - VITE_FB_MEASUREMENT_ID

   Use the values from your Firebase project (production credentials). These must be set for production builds to initialize Firebase correctly.

4. Deploy. Vercel will run `npm run build` and publish the resulting `dist/` directory.

Local testing

- Copy `.env.example` to `.env.local` and fill the VITE_FB_* values for local development.
- Run `npm run dev` to test locally.

Notes

- The repository already includes `vercel.json` to ensure Vercel uses `@vercel/static-build` and serves the SPA with a fallback route to `index.html`.
- Do not commit actual Firebase credentials. Use Vercel environment variables for production secrets.
