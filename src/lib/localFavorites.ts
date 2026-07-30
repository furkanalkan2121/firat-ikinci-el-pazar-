/**
 * localFavorites.ts
 * Favori ilanlar — Firebase Firestore tabanlı (hesaba bağlı, tüm cihazlarda ortak).
 * Koleksiyon: favorites, doküman id: `${userId}__${listingId}`
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
} from 'firebase/firestore';

const COL = 'favorites';
const favId = (userId: string, listingId: string) => `${userId}__${listingId}`;

/** Header/bileşenlerin yenilenmesi için olay yay. */
function emitUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('fu_favorites_updated'));
}

/** Kullanıcının favori ilan id'leri. */
export async function getFavorites(userId?: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const snap = await getDocs(query(collection(db, COL), where('userId', '==', userId)));
    return snap.docs.map(d => (d.data() as any).listingId as string);
  } catch {
    return [];
  }
}

export async function isFavorite(userId: string | undefined, listingId: string): Promise<boolean> {
  if (!userId || !listingId) return false;
  try {
    const snap = await getDoc(doc(db, COL, favId(userId, listingId)));
    return snap.exists();
  } catch {
    return false;
  }
}

/** Favoriyi aç/kapat. Dönen değer: artık favori mi? */
export async function toggleFavorite(userId: string, listingId: string): Promise<boolean> {
  if (!userId || !listingId) return false;
  const ref = doc(db, COL, favId(userId, listingId));
  const exists = (await getDoc(ref)).exists();
  if (exists) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { userId, listingId, createdAt: new Date().toISOString() });
  }
  emitUpdated();
  return !exists;
}

/** Bir ilanı favorileyen tüm kullanıcı id'leri (fiyat düşüşü bildirimi için). */
export async function getFavoriteUsersForListing(listingId: string): Promise<string[]> {
  if (!listingId) return [];
  try {
    const snap = await getDocs(query(collection(db, COL), where('listingId', '==', listingId)));
    return snap.docs.map(d => (d.data() as any).userId as string);
  } catch {
    return [];
  }
}

/** Silinen bir ilanı favorilerden temizle. Başka kullanıcıların kayıtları
 *  güvenlik kuralınca reddedilebilir; bu yüzden en iyi çaba (best-effort) yapılır. */
export async function removeListingFromAllFavorites(listingId: string): Promise<void> {
  if (!listingId) return;
  try {
    const snap = await getDocs(query(collection(db, COL), where('listingId', '==', listingId)));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref).catch(() => {})));
    emitUpdated();
  } catch { /* yok say */ }
}

/** Bir kullanıcının tüm favorilerini sil (hesap silme için). */
export async function clearUserFavorites(userId: string): Promise<void> {
  if (!userId) return;
  const snap = await getDocs(query(collection(db, COL), where('userId', '==', userId)));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  emitUpdated();
}
