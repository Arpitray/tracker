// Enhanced Firebase Client with Complete User Data Management
import { app } from '../firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, increment, orderBy, limit } from 'firebase/firestore';

const auth = getAuth(app);
const db = getFirestore(app);

// Auth helpers (existing)
export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  try { await sendEmailVerification(userCredential.user); } catch (e) { /* ignore */ }
  return userCredential.user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// NEW: Create or update user document in Firestore on signup/login
export async function createOrUpdateUserDoc(user) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  const userData = {
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || '',
    photoURL: user.photoURL || '',
    emailVerified: user.emailVerified,
    lastActiveAt: serverTimestamp(),
    provider: user.providerData?.[0]?.providerId || 'password'
  };

  if (!userSnap.exists()) {
    // First time - create user doc with createdAt
    await setDoc(userRef, {
      ...userData,
      ownerId: user.uid,
      createdAt: serverTimestamp()
    });
  } else {
    // Update existing user doc
    await setDoc(userRef, { ...userData, ownerId: user.uid }, { merge: true });
  }
  
  return userData;
}

// Habit Cards (existing functionality)
function userCardsCollection(uid) {
  return collection(db, 'users', uid, 'cards');
}

export function listenUserCards(uid, onUpdate) {
  const q = collection(db, 'users', uid, 'cards');
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => {
      const data = d.data() || {};
      // Normalize Firestore Timestamp fields to numbers (ms since epoch) for the UI
      const normalized = { id: d.id, ...data };
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        normalized.createdAt = data.createdAt.toDate().getTime();
      } else if (typeof data.createdAt === 'object' && data.createdAt !== null && data.createdAt.seconds) {
        // fallback for raw timestamp-like object
        normalized.createdAt = (data.createdAt.seconds || 0) * 1000 + (data.createdAt.nanoseconds ? Math.floor(data.createdAt.nanoseconds / 1e6) : 0);
      }
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        normalized.updatedAt = data.updatedAt.toDate().getTime();
      }
      if (data.lastCompletedAt && typeof data.lastCompletedAt.toDate === 'function') {
        normalized.lastCompletedAt = data.lastCompletedAt.toDate().getTime();
      }
      // ensure completions is numeric
      if (typeof normalized.completions === 'undefined') normalized.completions = 0;
      items.push(normalized);
    });
    onUpdate(items);
  });
}

export async function saveCard(uid, card) {
  // Check if this is an existing Firestore document (either Firestore auto-ID or starts with 'db-')
  const isExisting = card.id && (
    // Firestore auto-generated IDs are typically 20 characters, alphanumeric
    (typeof card.id === 'string' && card.id.length >= 15 && !/^\d+$/.test(card.id)) ||
    // Legacy check for 'db-' prefixed IDs
    String(card.id).startsWith('db-')
  );

  if (isExisting) {
    const ref = doc(db, 'users', uid, 'cards', card.id);
    const copy = { ...card };
    delete copy.id;
    copy.updatedAt = serverTimestamp();
    // ensure ownerId is present for security rules
    copy.ownerId = uid;
    await setDoc(ref, copy, { merge: true });
    return { id: card.id, ...copy };
  }

  const ref = await addDoc(userCardsCollection(uid), { 
    ...card, 
    ownerId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  // return the stored representation including generated id and ownerId
  return { id: ref.id, ownerId: uid, ...card };
}

export async function deleteCard(uid, cardId) {
  const ref = doc(db, 'users', uid, 'cards', cardId);
  return deleteDoc(ref);
}

// NEW: User Preferences Management
export async function saveUserPreferences(uid, preferences) {
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  const toSave = { ...preferences, ownerId: uid, updatedAt: serverTimestamp() };
  await setDoc(ref, toSave, { merge: true });
  return toSave;
}

export function listenUserPreferences(uid, onUpdate) {
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  return onSnapshot(ref, (doc) => {
    const data = doc.exists() ? doc.data() : getDefaultPreferences();
    onUpdate(data);
  });
}

export async function getUserPreferences(uid) {
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : getDefaultPreferences();
}

function getDefaultPreferences() {
  return {
    theme: 'light',
    notifications: true,
    language: 'en',
    soundEffects: true,
    emailReminders: false,
    weekStartsOn: 'monday',
    timeFormat: '24h',
    cardViewMode: 'grid'
  };
}

// NEW: User Profile Management
export async function saveUserProfile(uid, profile) {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  const toSave = { ...profile, ownerId: uid, updatedAt: serverTimestamp() };
  await setDoc(ref, toSave, { merge: true });
  // Also ensure root user document has basic profile fields
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { displayName: profile.displayName || null, photoURL: profile.photoURL || null, ownerId: uid, lastActiveAt: serverTimestamp() }, { merge: true });
  return toSave;
}

export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

export function listenUserProfile(uid, onUpdate) {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  return onSnapshot(ref, (doc) => {
    onUpdate(doc.exists() ? doc.data() : {});
  });
}

// NEW: Goals and Achievements
export async function saveUserGoal(uid, goal) {
  const ref = collection(db, 'users', uid, 'goals');
  const newGoal = {
    ...goal,
  ownerId: uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  status: 'active'
  };
  const docRef = await addDoc(ref, newGoal);
  return { id: docRef.id, ...newGoal };
}

export function listenUserGoals(uid, onUpdate) {
  const q = collection(db, 'users', uid, 'goals');
  return onSnapshot(q, (snap) => {
    const goals = [];
    snap.forEach((d) => goals.push({ id: d.id, ...d.data() }));
    onUpdate(goals);
  });
}

export async function updateGoalProgress(uid, goalId, progress) {
  const ref = doc(db, 'users', uid, 'goals', goalId);
  await updateDoc(ref, {
    currentProgress: progress,
    updatedAt: serverTimestamp()
  });
}

// NEW: Update a card's (habit) progress atomically. Use this to record completions, streaks, last completed time, and completion flag.
export async function updateCardProgress(uid, cardId, { completionsDelta = 0, streak = null, completed = null, setFields = {} } = {}) {
  const ref = doc(db, 'users', uid, 'cards', cardId);
  const updates = { updatedAt: serverTimestamp() };

  if (completionsDelta) updates.completions = increment(completionsDelta);
  if (streak !== null) updates.streak = streak;
  if (completed !== null) updates.completed = completed;
  // allow callers to set additional fields (e.g. lastCompletedAt) via setFields
  Object.assign(updates, setFields);

  await updateDoc(ref, updates);
}

// NEW: Record individual completion events for detailed analytics
export async function recordCompletion(uid, cardId, completionData = {}) {
  const completionRef = collection(db, 'users', uid, 'completions');
  const completion = {
  ownerId: uid,
    cardId,
    completedAt: serverTimestamp(),
    note: completionData.note || '',
    mood: completionData.mood || null,
    timeSpent: completionData.timeSpent || null,
    streakDay: completionData.streakDay || 1,
    location: completionData.location || '',
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(completionRef, completion);
  return { id: docRef.id, ...completion };
}

// NEW: Get completion history for a specific card or all cards
export async function getCompletionHistory(uid, cardId = null, limit = 50) {
  let q = collection(db, 'users', uid, 'completions');
  
  if (cardId) {
    q = query(q, where('cardId', '==', cardId));
  }
  
  q = query(q, orderBy('completedAt', 'desc'));
  if (limit) q = query(q, limit(limit));
  
  const snap = await getDocs(q);
  const completions = [];
  snap.forEach((doc) => {
    completions.push({ id: doc.id, ...doc.data() });
  });
  
  return completions;
}

// NEW: User Analytics and Activity Tracking
export async function trackUserAction(uid, action, data = {}) {
  const ref = collection(db, 'users', uid, 'analytics');
  await addDoc(ref, {
  ownerId: uid,
  action,
  data,
  timestamp: serverTimestamp(),
  userAgent: navigator.userAgent,
  url: window.location.href
  });
}

// NEW: Categories for organizing habits
export async function saveHabitCategory(uid, category) {
  const ref = collection(db, 'users', uid, 'categories');
  const newCategory = {
    ...category,
  ownerId: uid,
  cardCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(ref, newCategory);
  return { id: docRef.id, ...newCategory };
}

export function listenHabitCategories(uid, onUpdate) {
  const q = collection(db, 'users', uid, 'categories');
  return onSnapshot(q, (snap) => {
    const categories = [];
    snap.forEach((d) => categories.push({ id: d.id, ...d.data() }));
    onUpdate(categories);
  });
}

// NEW: Enhanced user stats with completion patterns
export async function getDetailedUserStats(uid) {
  const basicStats = await getUserStats(uid);
  
  // Get completion patterns from completions collection
  const completionsRef = collection(db, 'users', uid, 'completions');
  const recentCompletions = query(completionsRef, orderBy('completedAt', 'desc'), limit(100));
  const completionsSnap = await getDocs(recentCompletions);
  
  const completionsByHour = {};
  const completionsByDay = {};
  let totalTimeSpent = 0;
  let completionsWithMood = 0;
  let totalMoodScore = 0;
  
  completionsSnap.forEach((doc) => {
    const completion = doc.data();
    const date = completion.completedAt.toDate();
    
    // Hour patterns
    const hour = date.getHours();
    completionsByHour[hour] = (completionsByHour[hour] || 0) + 1;
    
    // Day patterns
    const day = date.getDay(); // 0 = Sunday
    completionsByDay[day] = (completionsByDay[day] || 0) + 1;
    
    // Time and mood
    if (completion.timeSpent) totalTimeSpent += completion.timeSpent;
    if (completion.mood) {
      completionsWithMood++;
      totalMoodScore += completion.mood;
    }
  });
  
  return {
    ...basicStats,
    patterns: {
      bestHour: Object.keys(completionsByHour).reduce((a, b) => 
        completionsByHour[a] > completionsByHour[b] ? a : b, '9'),
      bestDay: Object.keys(completionsByDay).reduce((a, b) => 
        completionsByDay[a] > completionsByDay[b] ? a : b, '1'),
      completionsByHour,
      completionsByDay
    },
    timeStats: {
      totalTimeSpent,
      averageTimePerCompletion: totalTimeSpent > 0 ? Math.round(totalTimeSpent / completionsSnap.size) : 0
    },
    moodStats: {
      averageMood: completionsWithMood > 0 ? (totalMoodScore / completionsWithMood).toFixed(1) : null,
      moodEntries: completionsWithMood
    }
  };
}

export async function getUserStats(uid) {
  const cardsRef = collection(db, 'users', uid, 'cards');
  const cardsSnap = await getDocs(cardsRef);
  
  let totalCards = 0;
  let completedCards = 0;
  let totalCompletions = 0;
  let longestStreak = 0;
  let activeCards = 0;

  cardsSnap.forEach((doc) => {
    const data = doc.data() || {};
    const card = { ...data };
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      card.createdAt = data.createdAt.toDate().getTime();
    }
    totalCards++;
    
    if (card.completed) completedCards++;
    if (!card.completed) activeCards++;
    
    totalCompletions += (card.completions || 0);
    
    if (card.streak > longestStreak) {
      longestStreak = card.streak;
    }
  });

  return {
    totalCards,
    completedCards,
    activeCards,
    totalCompletions,
    longestStreak,
    completionRate: totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0
  };
}

// NEW: Data Export (GDPR Compliance)
export async function exportUserData(uid) {
  const userData = {
    exportDate: new Date().toISOString(),
    userId: uid
  };

  // Export cards
  const cardsRef = collection(db, 'users', uid, 'cards');
  const cardsSnap = await getDocs(cardsRef);
  userData.cards = [];
  cardsSnap.forEach((doc) => {
    userData.cards.push({ id: doc.id, ...doc.data() });
  });

  // Export preferences
  userData.preferences = await getUserPreferences(uid);

  // Export profile
  userData.profile = await getUserProfile(uid);

  // Export goals
  const goalsRef = collection(db, 'users', uid, 'goals');
  const goalsSnap = await getDocs(goalsRef);
  userData.goals = [];
  goalsSnap.forEach((doc) => {
    userData.goals.push({ id: doc.id, ...doc.data() });
  });

  return userData;
}

// NEW: Account Deletion (GDPR Compliance)
export async function deleteUserData(uid) {
  const batch = [];
  
  // Delete all subcollections
  const collections = ['cards', 'goals', 'analytics'];
  
  for (const collectionName of collections) {
    const ref = collection(db, 'users', uid, collectionName);
    const snap = await getDocs(ref);
    snap.forEach((doc) => {
      batch.push(['delete', doc.ref]);
    });
  }

  // Delete settings
  const settingsRef = collection(db, 'users', uid, 'settings');
  const settingsSnap = await getDocs(settingsRef);
  settingsSnap.forEach((doc) => {
    batch.push(['delete', doc.ref]);
  });

  // Delete profile
  const profileRef = collection(db, 'users', uid, 'profile');
  const profileSnap = await getDocs(profileRef);
  profileSnap.forEach((doc) => {
    batch.push(['delete', doc.ref]);
  });

  // Execute all deletions
  for (const [operation, ref] of batch) {
    if (operation === 'delete') {
      await deleteDoc(ref);
    }
  }

  return true;
}

// NEW: Backup and Sync
export async function createUserBackup(uid) {
  const userData = await exportUserData(uid);
  const backupRef = doc(db, 'backups', uid);
  await setDoc(backupRef, {
    ...userData,
    createdAt: serverTimestamp()
  });
  return userData;
}

export { auth, db };
