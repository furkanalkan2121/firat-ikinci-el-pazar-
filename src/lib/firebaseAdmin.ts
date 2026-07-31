/**
 * firebaseAdmin.ts — SADECE SUNUCU (API route) tarafında kullanılır.
 * Firebase Admin SDK'yı tembel (lazy) başlatır; böylece env değişkenleri
 * yoksa bile normal build kırılmaz (yalnızca çağrıldığında başlatılır).
 *
 * Gereken ortam değişkenleri (Vercel + .env.local):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (service account'taki private_key; satır sonları \n olarak)
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) { adminApp = getApps()[0]; return adminApp; }

  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin ortam değişkenleri eksik (FIREBASE_ADMIN_*).');
  }

  adminApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return adminApp;
}

export function adminAuth() { return getAuth(getAdminApp()); }
export function adminDb()   { return getFirestore(getAdminApp()); }
