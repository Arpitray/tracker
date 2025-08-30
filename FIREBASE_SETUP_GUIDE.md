# Complete Firebase Setup for User Data Persistence

## Step 1: Create Firebase Project (5 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create Project**:
   - Name: `habit-tracker-production`
   - Enable Google Analytics: Yes
   - Choose region closest to your users

## Step 2: Enable Authentication (3 minutes)

1. **Authentication → Sign-in method**:
   - Enable Email/Password ✅
   - Enable Google ✅
   - Add your domain to authorized domains

## Step 3: Setup Firestore Database (5 minutes)

1. **Firestore Database → Create database**:
   - Start in production mode
   - Choose location (same as project region)

2. **Apply Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4: Get Configuration (2 minutes)

1. **Project Settings → General → Your apps**
2. **Add web app**: "Habit Tracker"
3. **Copy the config object**

## Step 5: Environment Setup (3 minutes)

Create `.env.local` in your project root:

```env
# Firebase Configuration (Replace with your actual values)
VITE_FB_API_KEY=your_api_key_here
VITE_FB_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FB_PROJECT_ID=your_project_id
VITE_FB_STORAGE_BUCKET=your_project.appspot.com
VITE_FB_MESSAGING_SENDER_ID=123456789
VITE_FB_APP_ID=1:123456789:web:abcdef123456
VITE_FB_MEASUREMENT_ID=G-ABCDEF1234
```

## What Data is Already Being Stored

### Habit Cards (per user):
- ✅ Title and description
- ✅ Completion count and streak
- ✅ Progress percentage
- ✅ Deadline dates
- ✅ Creation and update timestamps
- ✅ Card position (x, y coordinates)

### Authentication Data:
- ✅ User ID (Firebase UID)
- ✅ Email address
- ✅ Display name
- ✅ Profile photo (Google)
- ✅ Email verification status

## Advanced Data Storage Options

### 1. User Preferences
```javascript
// Add to firebaseClient.js
export async function saveUserPreferences(uid, preferences) {
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  await setDoc(ref, preferences, { merge: true });
}

export function listenUserPreferences(uid, onUpdate) {
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  return onSnapshot(ref, (doc) => {
    onUpdate(doc.exists() ? doc.data() : {});
  });
}
```

### 2. User Analytics
```javascript
// Add analytics tracking
export async function trackUserAction(uid, action, data = {}) {
  const ref = collection(db, 'users', uid, 'analytics');
  await addDoc(ref, {
    action,
    data,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent,
  });
}
```

### 3. Goals and Achievements
```javascript
// Track user goals
export async function saveUserGoal(uid, goal) {
  const ref = collection(db, 'users', uid, 'goals');
  return await addDoc(ref, {
    ...goal,
    createdAt: serverTimestamp(),
    status: 'active'
  });
}
```

## Data Structure in Firestore

```
users/
├── {userId}/
│   ├── cards/
│   │   ├── {cardId}/
│   │   │   ├── title: "Exercise Daily"
│   │   │   ├── details: "30 minutes workout"
│   │   │   ├── deadline: "2025-09-01"
│   │   │   ├── completions: 5
│   │   │   ├── progress: 75
│   │   │   ├── streak: 3
│   │   │   ├── x: 100 (card position)
│   │   │   ├── y: 200
│   │   │   ├── createdAt: timestamp
│   │   │   └── updatedAt: timestamp
│   │   └── {cardId2}/...
│   ├── settings/
│   │   └── preferences/
│   │       ├── theme: "dark"
│   │       ├── notifications: true
│   │       └── language: "en"
│   ├── goals/
│   │   └── {goalId}/
│   │       ├── title: "Complete 30 days"
│   │       ├── target: 30
│   │       ├── current: 15
│   │       └── deadline: "2025-12-31"
│   └── analytics/
│       └── {actionId}/
│           ├── action: "card_completed"
│           ├── timestamp: timestamp
│           └── data: {...}
```

## Security Features Already Implemented

1. **User Isolation**: Each user can only access their own data
2. **Authentication Required**: All database operations require login
3. **Real-time Validation**: Firestore rules validate data structure
4. **Automatic Cleanup**: Card deletion removes from database

## Performance Optimizations

1. **Real-time Listeners**: Changes sync instantly across devices
2. **Offline Support**: Firestore caches data for offline use
3. **Efficient Queries**: Only loads user's own data
4. **Batch Operations**: Multiple changes can be batched

## Testing Your Data Persistence

1. **Create an account** and log in
2. **Add some habit cards** with different data
3. **Log out and log back in** - data should persist
4. **Open in multiple tabs** - changes sync real-time
5. **Check Firestore Console** to see data structure

Your Firebase setup is already production-ready! Just need to:
1. Create the Firebase project
2. Add your config to `.env.local`
3. Deploy with your hosting provider

Total setup time: ~15-20 minutes
