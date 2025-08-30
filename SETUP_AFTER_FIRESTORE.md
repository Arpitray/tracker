# Quick Firebase Setup Steps

## ✅ What You've Done
- Created Firestore collections in Firebase Console
- Added seed test data functionality to the app
- Dev server is running at http://localhost:5174/

## 🔧 What You Need to Do Now

### 1. Add Firebase Config (Required)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ → Project Settings
4. Scroll to "SDK setup and configuration"
5. Copy the config values
6. Edit `.env.local` in this project and replace the placeholder values
7. Restart the dev server: `npm run dev`

### 2. Enable Authentication (Required)
1. In Firebase Console → Authentication
2. Click "Get started" 
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Enable "Google" provider (optional but recommended)

### 3. Deploy Firestore Rules (Recommended)
Run in PowerShell:
```powershell
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` into Firebase Console → Firestore Database → Rules

### 4. Test the Connection
1. Open http://localhost:5174/
2. Sign up for a new account
3. Go to Settings → Data Management
4. Click "Create sample card & completion"
5. Check Firebase Console → Firestore to see the new documents

## 🐛 Troubleshooting

### App won't start?
- Check `.env.local` has correct Firebase config
- Run `npm install` if missing dependencies

### Sign-up fails?
- Ensure Authentication providers are enabled in Firebase Console
- Check browser console for errors

### Data not saving?
- Check Firestore rules are deployed
- Verify user is signed in
- Check browser console for permission errors

### Need help?
- Check browser console (F12) for error messages
- Verify Firebase config is correct
- Make sure Firestore rules allow user access

## 📁 Project Structure After Setup
```
users/{uid}/
├── displayName, email, createdAt (user profile)
├── cards/{cardId}/ (habit documents)
├── completions/{completionId}/ (completion events)
├── settings/preferences (user preferences)
└── categories/{categoryId}/ (habit categories)
```

## 🚀 Ready to Use Features

After setup, you can:
- ✅ Create habit cards
- ✅ Track completions with mood/notes
- ✅ View real-time statistics 
- ✅ Export/backup data
- ✅ Organize habits by categories
- ✅ User preferences/settings
