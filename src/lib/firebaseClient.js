// firebaseClient.js
// Thin wrapper around Firebase modular SDK for Auth and Firestore
import { app } from '../firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const auth = getAuth(app);
const db = getFirestore(app);

// Auth helpers
export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // send verification email
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

// Firestore helpers for user cards (stored under users/{uid}/cards/{cardId})
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
  // if card has id use update, otherwise add
  if (card.id && String(card.id).startsWith('db-')) {
    // already a Firestore doc id
    const ref = doc(db, 'users', uid, 'cards', card.id);
    const copy = { ...card };
    delete copy.id;
    copy.updatedAt = serverTimestamp();
    await setDoc(ref, copy, { merge: true });
    return { id: card.id, ...copy };
  }

  // create new document
  const ref = await addDoc(userCardsCollection(uid), { ...card, createdAt: serverTimestamp() });
  return { id: ref.id, ...card };
}

export async function deleteCard(uid, cardId) {
  const ref = doc(db, 'users', uid, 'cards', cardId);
  return deleteDoc(ref);
}

export { auth, db };
