/**
 * localReviews.ts
 * Satıcı değerlendirmeleri ve yorumlarını localStorage üzerinde saklayan katman.
 */

export type Review = {
  id: string;
  sellerId: string; // Yorum yapılan satıcının UID veya email bilgisi
  reviewerId: string; // Yorum yapanın UID
  reviewerEmail: string; // Yorum yapanın e-postası
  rating: number; // 1 - 5 arası yıldız
  comment: string;
  createdAt: string;
};

const REVIEWS_KEY = 'fu_reviews';

export function getSellerReviews(sellerId: string): Review[] {
  if (typeof window === 'undefined' || !sellerId) return [];
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    const reviews: Review[] = raw ? JSON.parse(raw) : [];
    return reviews
      .filter(r => r.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function addSellerReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
  const raw = localStorage.getItem(REVIEWS_KEY);
  const reviews: Review[] = raw ? JSON.parse(raw) : [];
  
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(newReview);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  return newReview;
}

export function getSellerAverageRating(sellerId: string): { average: number; count: number } {
  const reviews = getSellerReviews(sellerId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = Math.round((total / reviews.length) * 10) / 10;
  return { average, count: reviews.length };
}
