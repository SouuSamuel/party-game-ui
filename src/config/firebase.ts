import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

export type OnlineIdentity = {
  uid: string;
  isAnonymous: boolean;
};

function readFirebaseConfig() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured() {
  const config = readFirebaseConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getFirebaseClient(): FirebaseClient {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado. Defina as variáveis EXPO_PUBLIC_FIREBASE_* no ambiente EAS/local.');
  }

  const config = readFirebaseConfig();
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

export async function getAnonymousIdentity(): Promise<OnlineIdentity> {
  const { auth } = getFirebaseClient();
  const user: User = auth.currentUser ?? (await signInAnonymously(auth)).user;
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
  };
}
