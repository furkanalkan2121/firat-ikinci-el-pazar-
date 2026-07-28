/**
 * localFavorites.ts
 * Kullanıcının favori ilanlarını localStorage üzerinde yöneten yardımcı katman.
 */

const FAVORITES_KEY = 'fu_favorites';

export function getFavorites(userId?: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${FAVORITES_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(userId: string | undefined, listingId: string): boolean {
  if (!userId || !listingId) return false;
  const favs = getFavorites(userId);
  return favs.includes(listingId);
}

export function toggleFavorite(userId: string, listingId: string): boolean {
  if (!userId || !listingId) return false;
  const favs = getFavorites(userId);
  const exists = favs.includes(listingId);
  
  let updated: string[];
  if (exists) {
    updated = favs.filter(id => id !== listingId);
  } else {
    updated = [...favs, listingId];
  }
  
  localStorage.setItem(`${FAVORITES_KEY}_${userId}`, JSON.stringify(updated));
  // Cross-component update trigger
  window.dispatchEvent(new Event('fu_favorites_updated'));
  return !exists;
}

/** Bir ilanı favorileyen tüm kullanıcı ID'lerini döndür */
export function getFavoriteUsersForListing(listingId: string): string[] {
  if (typeof window === 'undefined' || !listingId) return [];
  const users: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${FAVORITES_KEY}_`)) {
        const userId = key.replace(`${FAVORITES_KEY}_`, '');
        const raw = localStorage.getItem(key);
        const favs: string[] = raw ? JSON.parse(raw) : [];
        if (favs.includes(listingId)) {
          users.push(userId);
        }
      }
    }
  } catch {}
  return users;
}
