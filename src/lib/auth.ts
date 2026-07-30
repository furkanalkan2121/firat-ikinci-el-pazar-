/**
 * auth.ts
 * Firebase Authentication tabanlı kimlik doğrulama.
 * Gerçek e-posta doğrulama (sendEmailVerification) içerir.
 */
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  type User as FirebaseUser,
} from 'firebase/auth';

export type LocalUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
};

/** Admin yetkisi olan e-postalar (tam eşleşme). */
export const ADMIN_EMAILS = ['admin@firat.edu.tr'];

export function isAdminUser(user: { email: string } | null | undefined): boolean {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/** Firebase kullanıcısını uygulama tipine çevir. */
export function mapUser(fb: FirebaseUser | null): LocalUser | null {
  if (!fb || !fb.email) return null;
  return { uid: fb.uid, email: fb.email, emailVerified: fb.emailVerified };
}

/** Anlık kullanıcı (senkron). Auth henüz yüklenmediyse null olabilir. */
export function getCurrentUser(): LocalUser | null {
  return mapUser(auth.currentUser);
}

/** Firebase hata kodlarını Türkçe mesaja çevir. */
function trError(err: any): Error {
  const code: string = err?.code || '';
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter olmalı).',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı. Tekrar deneyin.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.',
    'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    'auth/requires-recent-login': 'Bu işlem için lütfen çıkış yapıp tekrar giriş yapın.',
  };
  return new Error(map[code] || err?.message || 'Bir hata oluştu.');
}

/**
 * Yeni hesap oluştur ve e-posta doğrulama bağlantısı gönder.
 * Doğrulama tamamlanmadan giriş yapılamaması için hemen çıkış yapılır.
 */
export async function signUp(email: string, password: string): Promise<void> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  } catch (err) {
    throw trError(err);
  }
}

/** Giriş yap. E-posta doğrulanmamışsa girişi reddet. */
export async function signIn(email: string, password: string): Promise<void> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      const e: any = new Error('E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki doğrulama bağlantısına tıklayın.');
      e.code = 'auth/email-not-verified';
      throw e;
    }
  } catch (err: any) {
    if (err?.code === 'auth/email-not-verified') throw err;
    throw trError(err);
  }
}

/** Doğrulama e-postasını tekrar gönder (geçici giriş yaparak). */
export async function resendVerification(email: string, password: string): Promise<void> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  } catch (err) {
    throw trError(err);
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/** Mevcut şifreyle yeniden kimlik doğrulayıp yeni şifreyi ayarla. */
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const u = auth.currentUser;
  if (!u || !u.email) throw new Error('Oturum bulunamadı.');
  try {
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
    await updatePassword(u, newPassword);
  } catch (err) {
    throw trError(err);
  }
}

/** Hesabı kalıcı olarak sil (yeniden kimlik doğrulama gerektirir). */
export async function deleteCurrentUser(password: string): Promise<void> {
  const u = auth.currentUser;
  if (!u || !u.email) throw new Error('Oturum bulunamadı.');
  try {
    const cred = EmailAuthProvider.credential(u.email, password);
    await reauthenticateWithCredential(u, cred);
    await deleteUser(u);
  } catch (err) {
    throw trError(err);
  }
}
