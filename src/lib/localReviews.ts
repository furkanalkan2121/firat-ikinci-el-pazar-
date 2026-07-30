/**
 * localReviews.ts
 * Satıcı değerlendirmeleri — Firebase Firestore tabanlı (paylaşılan).
 * Koleksiyon: reviews
 */
import { db } from './firebase';
import {
  collection, addDoc, getDocs, deleteDoc, query, where,
} from 'firebase/firestore';

export type Review = {
  id: string;
  sellerId: string;   // Değerlendirilen satıcının UID'i
  reviewerId: string; // Yorum yapanın UID'i
  reviewerEmail: string;
  rating: number;     // 1 - 5
  comment: string;
  createdAt: string;
};

const COL = 'reviews';

export async function getSellerReviews(sellerId: string): Promise<Review[]> {
  if (!sellerId) return [];
  try {
    const snap = await getDocs(query(collection(db, COL), where('sellerId', '==', sellerId)));
    return snap.docs
      .map(d => ({ ...(d.data() as any), id: d.id } as Review))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function addSellerReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  const data = { ...review, createdAt: new Date().toISOString() };
  const ref = await addDoc(collection(db, COL), data);
  return { ...data, id: ref.id };
}

export async function getSellerAverageRating(sellerId: string): Promise<{ average: number; count: number }> {
  const reviews = await getSellerReviews(sellerId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = Math.round((total / reviews.length) * 10) / 10;
  return { average, count: reviews.length };
}

/** Bir kullanıcının yaptığı veya hakkında yapılan tüm yorumları sil (hesap silme için). */
export async function deleteUserReviews(userId: string): Promise<void> {
  if (!userId) return;
  const [asReviewer, asSeller] = await Promise.all([
    getDocs(query(collection(db, COL), where('reviewerId', '==', userId))),
    getDocs(query(collection(db, COL), where('sellerId', '==', userId))),
  ]);
  await Promise.all([...asReviewer.docs, ...asSeller.docs].map(d => deleteDoc(d.ref)));
}
