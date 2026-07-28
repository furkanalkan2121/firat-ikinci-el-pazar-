/**
 * localFood.ts
 * Fırat Üniversitesi Günlük Yemekhane Menüsü ve Öğrenci Yorumları
 */

export type MealRating = {
  id: string;
  userId: string;
  userName: string;
  stars: number;
  comment: string;
  createdAt: string;
};

export type DailyMenu = {
  date: string;
  dayName: string;
  lunch: string[];  // Öğle Yemeği
  dinner: string[]; // Akşam Yemeği
  calories: number;
};

export const WEEKLY_MENU: DailyMenu[] = [
  {
    date: '2026-07-28',
    dayName: 'Salı (Bugün)',
    lunch: ['Süzme Mercimek Çorbası', 'Orman Kebabı', 'Şehriyeli Pirinç Pilavı', 'Kemalpaşa Tatlısı'],
    dinner: ['Ezogelin Çorbası', 'Tavuk Sote', 'Bulgur Pilavı', 'Mevsim Meyvesi'],
    calories: 890,
  },
  {
    date: '2026-07-29',
    dayName: 'Çarşamba',
    lunch: ['Yayla Çorbası', 'Kuru Fasulye', 'Pirinç Pilavı', 'Cacık'],
    dinner: ['Tarhana Çorbası', 'Fırın Köfte', 'Makarna', 'Salata'],
    calories: 920,
  },
  {
    date: '2026-07-30',
    dayName: 'Perşembe',
    lunch: ['Domates Çorbası', 'Tavuk Schnitzel', 'Patates Püresi', 'Meyve Suyu'],
    dinner: ['Mercimek Çorbası', 'Karnıyarık', 'Bulgur Pilavı', 'Yoğurt'],
    calories: 850,
  },
];

const RATINGS_KEY = 'fu_meal_ratings';

export function getMealRatings(): MealRating[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RATINGS_KEY);
  return raw ? JSON.parse(raw) : [
    {
      id: 'r-1',
      userId: 'demo-1',
      userName: 'Ali K.',
      stars: 5,
      comment: 'Orman kebabı ve pilav bugün harikaydı, aşçıların eline sağlık! 👏',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'r-2',
      userId: 'demo-2',
      userName: 'Selin T.',
      stars: 4,
      comment: 'Mercimek çorbası sıcaktı, tatlı biraz daha şerbetli olabilirdi.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
  ];
}

export function addMealRating(rating: Omit<MealRating, 'id' | 'createdAt'>): void {
  const ratings = getMealRatings();
  const newRating: MealRating = {
    ...rating,
    id: `meal-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  ratings.unshift(newRating);
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  window.dispatchEvent(new CustomEvent('fu_meal_ratings_updated'));
}
