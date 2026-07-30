/**
 * localStore.ts
 * İlan veri katmanı — Firebase Firestore tabanlı (gerçek, paylaşılan veri).
 * Fonksiyon imzaları eski localStorage sürümüyle uyumlu tutulmuştur.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, increment,
} from 'firebase/firestore';
import { addNotification } from './localNotifications';
import { getFavoriteUsersForListing, removeListingFromAllFavorites } from './localFavorites';

export type Listing = {
  id?: string;
  title: string;
  description?: string;
  price?: number;
  priceHistory?: Array<{ price: number; date: string }>; // Fiyat değişim geçmişi
  images?: string[];
  ownerId?: string;
  ownerEmail?: string;  // İlan sahibinin e-postası (mesajlaşma & satıcı gösterimi için)
  category?: string;
  department?: string; // FÜ Fakülte/Bölüm seçeneği
  location?: string;   // FÜ Kampüs Teslimat Noktası
  isExchange?: boolean; // Sadece Takas / Değiş-tokuş ilanı mı?
  allowTrade?: boolean; // Hem Satılık Hem Takasa Uygundur
  isFeatured?: boolean; // Vitrin / Öne Çıkarılan İlan
  createdAt?: string;
  isSold?: boolean;
  viewsCount?: number;
};

export const FU_CAMPUS_LOCATIONS = [
  'Tüm Kampüs Noktaları',
  'Rektörlük Kampüsü',
  'Mühendislik Kampüsü (Ana Giriş)',
  'Merkez Kütüphane Önü',
  'Öğrenci Evi / Çarşı Bölgesi',
  'Tıp Fakültesi / Hastane Çevresi',
  'Doğu Kampüsü',
  'KYK Yurtlar Bölgesi',
  'Spor Kompleksi Önü',
];

export const FU_FACULTIES = [
  'Tüm Bölümler',
  'Mühendislik Fakültesi',
  'Tıp Fakültesi',
  'İktisadi ve İdari Bilimler Fakültesi',
  'Eğitim Fakültesi',
  'Fen Fakültesi',
  'İnsani ve Sosyal Bilimler Fakültesi',
  'İlahiyat Fakültesi',
  'Spor Bilimleri Fakültesi',
  'Teknoloji Fakültesi',
  'İletişim Fakültesi',
  'Diğer / Meslek Yüksekokulları',
];

export type Announcement = {
  id: string;
  title: string;
  clubName: string;
  content: string;
  date: string;
  emoji: string;
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Ders Kitabı & Materyal Değiş-Tokuş Günleri',
    clubName: 'FÜ Kitap Topluluğu',
    content: 'Dönem başı ders kitaplarınızı ücretsiz takas etmek için Çarşamba günü Öğrenci Merkezi önündeyiz!',
    date: '28 Temmuz 2026',
    emoji: '📚',
  },
  {
    id: 'ann-2',
    title: 'Yazılım ve Teknoloji Kulübü Proje Sergisi',
    clubName: 'FÜ Yazılım Kulübü',
    content: 'Öğrenci projelerinizi sergilemek ve ekip arkadaşı bulmak için forumumuza davetlisiniz.',
    date: '30 Temmuz 2026',
    emoji: '💻',
  },
  {
    id: 'ann-3',
    title: 'Kampüs İçi İkinci El Pazarı Kuruluyor',
    clubName: 'FÜ Öğrenci Konseyi',
    content: 'Mezun olan öğrencilerin eşyalarını devretmesi için Mühendislik bahçesinde stantlar açılacaktır.',
    date: '2 Ağustos 2026',
    emoji: '🎪',
  },
];

const COL = 'listings';

/** Bir Firestore dokümanını Listing'e çevir. */
function toListing(id: string, data: any): Listing {
  return { ...data, id } as Listing;
}

/* ── Okuma ── */

export async function getListings(): Promise<Listing[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => toListing(d.id, d.data()));
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!id) return null;
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  return snap.exists() ? toListing(snap.id, snap.data()) : null;
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  if (!userId) return [];
  // where + orderBy bileşik indeks gerektirmesin diye sıralama istemcide yapılır
  const q = query(collection(db, COL), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toListing(d.id, d.data()))
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

/** İçinde bulunulan ay içinde kullanıcının açtığı ilan sayısı. */
export async function getUserMonthlyListingCount(userId: string): Promise<number> {
  if (!userId) return 0;
  const now = new Date();
  const items = await getUserListings(userId);
  return items.filter(l => {
    if (!l.createdAt) return false;
    const d = new Date(l.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

/* ── Yazma ── */

export async function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Promise<string> {
  if (listing.ownerId) {
    const monthlyCount = await getUserMonthlyListingCount(listing.ownerId);
    if (monthlyCount >= 10) {
      throw new Error('Aylık ilan oluşturma limitine ulaştınız (Max 10 ilan/ay).');
    }
  }
  // undefined alanları Firestore kabul etmez — temizle
  const clean: Record<string, any> = { viewsCount: 0, createdAt: new Date().toISOString() };
  Object.entries(listing).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
  const ref = await addDoc(collection(db, COL), clean);
  return ref.id;
}

export async function updateListing(id: string, patch: Partial<Listing>): Promise<void> {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = snap.data() as Listing;
  const history = current.priceHistory || [];

  // Fiyat düştüyse geçmişe ekle ve favorileyenlere bildirim gönder
  if (patch.price !== undefined && current.price !== undefined && patch.price < current.price) {
    history.unshift({ price: current.price, date: new Date().toISOString() });
    const favUsers = await getFavoriteUsersForListing(id);
    await Promise.all(favUsers.map(uid =>
      addNotification({
        userId: uid,
        title: '📉 Favorinizde Fiyat Düşüşü!',
        message: `Favorilediğiniz "${current.title}" ilanının fiyatı ${current.price} ₺ yerine ${patch.price} ₺'ye düştü!`,
        listingId: id,
        type: 'price_drop',
      })
    ));
  }

  const clean: Record<string, any> = { priceHistory: history };
  Object.entries(patch).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
  await updateDoc(ref, clean);
}

export async function incrementListingViews(id: string): Promise<void> {
  if (!id) return;
  try {
    await updateDoc(doc(db, COL, id), { viewsCount: increment(1) });
  } catch { /* görüntülenme sayımı kritik değil */ }
}

export async function toggleFeaturedListing(id: string): Promise<boolean> {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const newStatus = !(snap.data() as Listing).isFeatured;
  await updateDoc(ref, { isFeatured: newStatus });
  return newStatus;
}

export async function toggleListingSold(id: string): Promise<boolean> {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('İlan bulunamadı.');
  const newStatus = !(snap.data() as Listing).isSold;
  await updateDoc(ref, { isSold: newStatus });
  return newStatus;
}

export async function deleteListing(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
  await removeListingFromAllFavorites(id); // favori kayıtlarını da temizle
}

export async function deleteUserAndListings(userId: string): Promise<void> {
  if (!userId) return;
  const items = await getUserListings(userId);
  await Promise.all(items.map(async l => {
    if (l.id) {
      await deleteDoc(doc(db, COL, l.id));
      await removeListingFromAllFavorites(l.id);
    }
  }));
}
