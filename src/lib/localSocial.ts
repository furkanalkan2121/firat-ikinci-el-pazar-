/**
 * localSocial.ts
 * Kampüs Tanışma / Sosyal ağ — Firebase Firestore tabanlı (gerçek, paylaşılan).
 * Koleksiyonlar:
 *   socialProfiles  (docId = uid) — kullanıcı başına TEK profil
 *   socialLikes     (docId = `${fromUid}__${toUid}`) — beğeniler; çift yönlü = eşleşme
 *   socialBlocks    (docId = `${blockerUid}__${blockedUid}`)
 *   socialReports   (auto id)
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, addDoc, query, where,
} from 'firebase/firestore';

export type SocialGoal =
  | 'Ders Çalışma 📚' | 'Proje Ekibi 💻' | 'Ev / Oda Arkadaşı 🏠'
  | 'Spor & Aktivite ⚽' | 'Kahve & Sohbet ☕' | 'Diğer';

export type SocialProfile = {
  id: string;        // = userId
  userId: string;
  userEmail: string;
  name: string;
  department: string;
  grade: string;
  goal: SocialGoal | string;
  bio: string;
  hobbies: string[];
  instagram?: string;
  avatar?: string;   // sıkıştırılmış data URL
  createdAt: string;
  updatedAt?: string;
};

const PROFILES = 'socialProfiles';
const LIKES    = 'socialLikes';
const BLOCKS   = 'socialBlocks';
const REPORTS  = 'socialReports';

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('fu_social_updated'));
}

/* ── Profiller ── */

export async function getSocialProfiles(): Promise<SocialProfile[]> {
  try {
    const snap = await getDocs(collection(db, PROFILES));
    return snap.docs
      .map(d => ({ ...(d.data() as any), id: d.id } as SocialProfile))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getMyProfile(uid: string): Promise<SocialProfile | null> {
  if (!uid) return null;
  const snap = await getDoc(doc(db, PROFILES, uid));
  return snap.exists() ? ({ ...(snap.data() as any), id: snap.id } as SocialProfile) : null;
}

/** Kullanıcının profilini oluştur veya güncelle (docId = uid ⇒ tek profil). */
export async function upsertSocialProfile(
  uid: string,
  data: Omit<SocialProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const ref = doc(db, PROFILES, uid);
  const existing = await getDoc(ref);
  const clean: Record<string, any> = {
    userId: uid,
    updatedAt: new Date().toISOString(),
    createdAt: existing.exists() ? (existing.data() as any).createdAt : new Date().toISOString(),
  };
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
  await setDoc(ref, clean, { merge: true });
  emit();
}

export async function deleteMyProfile(uid: string): Promise<void> {
  if (!uid) return;
  await deleteDoc(doc(db, PROFILES, uid));
  emit();
}

/* ── Beğeni / Eşleşme ── */

const likeId = (from: string, to: string) => `${from}__${to}`;

/** Birini beğen. Karşı taraf da beğendiyse eşleşme oluşur. */
export async function likeUser(from: string, to: string): Promise<{ matched: boolean }> {
  if (!from || !to || from === to) return { matched: false };
  await setDoc(doc(db, LIKES, likeId(from, to)), { fromUid: from, toUid: to, createdAt: new Date().toISOString() });
  const reciprocal = await getDoc(doc(db, LIKES, likeId(to, from)));
  emit();
  return { matched: reciprocal.exists() };
}

export async function unlikeUser(from: string, to: string): Promise<void> {
  if (!from || !to) return;
  await deleteDoc(doc(db, LIKES, likeId(from, to)));
  emit();
}

/** Benim beğendiklerim (toUid listesi). */
export async function getMyLikeTargets(uid: string): Promise<string[]> {
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, LIKES), where('fromUid', '==', uid)));
  return snap.docs.map(d => (d.data() as any).toUid as string);
}

/** Beni beğenenler (fromUid listesi). */
export async function getLikedMe(uid: string): Promise<string[]> {
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, LIKES), where('toUid', '==', uid)));
  return snap.docs.map(d => (d.data() as any).fromUid as string);
}

/** Karşılıklı beğeni = eşleşme (uid listesi). */
export async function getMatches(uid: string): Promise<string[]> {
  const [mine, theirs] = await Promise.all([getMyLikeTargets(uid), getLikedMe(uid)]);
  const set = new Set(theirs);
  return mine.filter(u => set.has(u));
}

/* ── Engelle / Şikayet ── */

const blockId = (blocker: string, blocked: string) => `${blocker}__${blocked}`;

export async function blockUser(blocker: string, blocked: string): Promise<void> {
  if (!blocker || !blocked || blocker === blocked) return;
  await setDoc(doc(db, BLOCKS, blockId(blocker, blocked)), { blocker, blocked, createdAt: new Date().toISOString() });
  // Engelleyince beğeniyi de kaldır
  await deleteDoc(doc(db, LIKES, likeId(blocker, blocked))).catch(() => {});
  emit();
}

export async function getBlockedByMe(uid: string): Promise<string[]> {
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, BLOCKS), where('blocker', '==', uid)));
  return snap.docs.map(d => (d.data() as any).blocked as string);
}

export async function reportProfile(reporterUid: string, targetUid: string, reason: string): Promise<void> {
  await addDoc(collection(db, REPORTS), {
    reporterUid, targetUid, reason, createdAt: new Date().toISOString(), status: 'pending',
  });
}

/* ── Hesap silme temizliği ── */
export async function deleteUserSocial(uid: string): Promise<void> {
  if (!uid) return;
  await deleteMyProfile(uid).catch(() => {});
  const [likesFrom, likesTo, blocksFrom] = await Promise.all([
    getDocs(query(collection(db, LIKES), where('fromUid', '==', uid))),
    getDocs(query(collection(db, LIKES), where('toUid', '==', uid))),
    getDocs(query(collection(db, BLOCKS), where('blocker', '==', uid))),
  ]);
  await Promise.all([
    ...likesFrom.docs.map(d => deleteDoc(d.ref).catch(() => {})),
    ...likesTo.docs.map(d => deleteDoc(d.ref).catch(() => {})),
    ...blocksFrom.docs.map(d => deleteDoc(d.ref).catch(() => {})),
  ]);
}
