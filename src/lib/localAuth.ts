/**
 * localAuth.ts
 * Web Crypto API (SHA-256) kullanan güvenli kimlik doğrulama.
 */

export type LocalUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
};

const AUTH_KEY  = 'fu_current_user';
const USERS_KEY = 'fu_users';

type UserRecord = { uid: string; passwordHash: string };
type UsersMap   = Record<string, UserRecord>;

/** Web Crypto API ile şifreyi SHA-256 formatında güvenli hash'le */
export async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return password; // Fallback
  }
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers(): UsersMap {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users: UsersMap): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ── Demo hesabını otomatik oluştur (SHA-256 hash ile) ── */
async function initDemoUser(): Promise<void> {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  if (!users['demo@firat.edu.tr']) {
    const passwordHash = await hashPassword('demo1234');
    users['demo@firat.edu.tr'] = { uid: 'demo-user', passwordHash };
    saveUsers(users);
  }
}

/* ── Public API ── */

export function getCurrentUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function signInLocal(email: string, password: string): Promise<LocalUser> {
  await initDemoUser();
  const users = getUsers();
  const record = users[email.toLowerCase()];
  if (!record) throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı.');

  const inputHash = await hashPassword(password);
  // Eski kayıtlar için geriye dönük uyumluluk veya SHA-256 kontrolü
  if (record.passwordHash !== inputHash && (record as any).password !== password) {
    throw new Error('Şifre hatalı. Tekrar deneyin.');
  }

  const user: LocalUser = { uid: record.uid, email: email.toLowerCase(), emailVerified: true };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export async function signUpLocal(email: string, password: string): Promise<LocalUser> {
  await initDemoUser();
  const users = getUsers();
  const key = email.toLowerCase();
  if (users[key]) throw new Error('Bu e-posta adresi zaten kullanımda.');
  const uid = `user-${Date.now()}`;
  const passwordHash = await hashPassword(password);
  users[key] = { uid, passwordHash };
  saveUsers(users);
  const user: LocalUser = { uid, email: key, emailVerified: true };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function signOutLocal(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(AUTH_KEY);
}

/** localStorage'daki tüm verileri sıfırla */
export function resetAll(): void {
  ['fu_current_user', 'fu_users', 'fu_listings'].forEach(k => localStorage.removeItem(k));
}
