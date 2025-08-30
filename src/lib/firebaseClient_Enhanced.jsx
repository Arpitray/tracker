// Enhanced Firebase Client with Complete User Data Management
import { app } from '../firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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

// Habit Cards (existing functionality)
function userCardsCollection(uid) {
  return collection(db, 'users', uid, 'cards');
}

export function listenUserCards(uid, onUpdate) {
  const q = collection(db, 'users', uid, 'cards');
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    onUpdate(items);
  });
}

export async function saveCard(uid, card) {
  if (card.id && String(card.id).startsWith('db-')) {
    const ref = doc(db, 'users', uid, 'cards', card.id);
    const copy = { ...card };
    delete copy.id;
    copy.updatedAt = serverTimestamp();
    await setDoc(ref, copy, { merge: true });
    return { id: card.id, ...copy };
  }

  const ref = await addDoc(userCardsCollection(uid), { 
    ...card, 
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: ref.id, ...card };
}

export async function deleteCard(uid, cardId) {
  const ref = doc(db, 'users', uid, 'cards', cardId);
  return deleteDoc(ref);
}

// NEW: User Preferences Management
export async function saveUserPreferences(uid, preferences) {
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  await setDoc(ref, {
    ...preferences,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return preferences;
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
  await setDoc(ref, {
    ...profile,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return profile;
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

// NEW: User Analytics and Activity Tracking
export async function trackUserAction(uid, action, data = {}) {
  const ref = collection(db, 'users', uid, 'analytics');
  await addDoc(ref, {
    action,
    data,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
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
    const card = doc.data();
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
