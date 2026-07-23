/**
 * localAuth.ts
 * Firebase Auth yerine localStorage kullanan mock kimlik doğrulama.
 * Gerçek şifre hashing yapılmamıştır — yalnızca geliştirme ortamı içindir.
 */

export type LocalUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
};

const AUTH_KEY  = 'fu_current_user';
const USERS_KEY = 'fu_users';

type UserRecord = { uid: string; password: string };
type UsersMap   = Record<string, UserRecord>;

function getUsers(): UsersMap {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users: UsersMap): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ── Demo hesabını otomatik oluştur ── */
function initDemoUser(): void {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  if (!users['demo@firat.edu.tr']) {
    users['demo@firat.edu.tr'] = { uid: 'demo-user', password: 'demo1234' };
    saveUsers(users);
  }
}

/* ── Public API ── */

export function getCurrentUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function signInLocal(email: string, password: string): LocalUser {
  initDemoUser();
  const users = getUsers();
  const record = users[email.toLowerCase()];
  if (!record) throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı.');
  if (record.password !== password) throw new Error('Şifre hatalı. Tekrar deneyin.');
  const user: LocalUser = { uid: record.uid, email: email.toLowerCase(), emailVerified: true };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function signUpLocal(email: string, password: string): LocalUser {
  initDemoUser();
  const users = getUsers();
  const key = email.toLowerCase();
  if (users[key]) throw new Error('Bu e-posta adresi zaten kullanımda.');
  const uid = `user-${Date.now()}`;
  users[key] = { uid, password };
  saveUsers(users);
  const user: LocalUser = { uid, email: key, emailVerified: true };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function signOutLocal(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(AUTH_KEY);
}

/** localStorage'daki tüm verileri sıfırla (debug için) */
export function resetAll(): void {
  ['fu_current_user', 'fu_users', 'fu_listings'].forEach(k => localStorage.removeItem(k));
}
