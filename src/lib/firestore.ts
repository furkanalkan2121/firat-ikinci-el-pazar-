/**
 * firestore.ts — artık Firebase kullanmıyor.
 * localStore'a yönlendirme katmanı: mevcut import'lar bozulmasın diye.
 */
export type { Listing } from './localStore';
export { getListings, addListing, deleteListing } from './localStore';
