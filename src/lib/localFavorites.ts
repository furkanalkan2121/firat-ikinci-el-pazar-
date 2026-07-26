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
