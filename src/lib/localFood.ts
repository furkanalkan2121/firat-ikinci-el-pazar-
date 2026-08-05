/**
 * localFood.ts
 * Fırat Üniversitesi Günlük / Haftalık Gerçek Yemekhane Menüsü ve Öğrenci Yorumları
 * (FÜ Sağlık Kültür ve Spor Daire Başkanlığı Yemek Listesi)
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
    date: '2026-08-03',
    dayName: 'Pazartesi',
    lunch: ['Süzme Mercimek Çorbası', 'Elazığ Usulü Harput Köfte', 'Şehriyeli Pirinç Pilavı', 'Kemalpaşa Tatlısı'],
    dinner: ['Ezogelin Çorbası', 'Tavuk Sote', 'Bulgur Pilavı', 'Mevsim Meyvesi (Şeftali)'],
    calories: 890,
  },
  {
    date: '2026-08-04',
    dayName: 'Salı',
    lunch: ['Yayla Çorbası', 'Kuru Fasulye', 'Pirinç Pilavı', 'Ev Yapımı Cacık'],
    dinner: ['Tarhana Çorbası', 'Fırın İzmir Köfte', 'Makarna', 'Çoban Salata'],
    calories: 920,
  },
  {
    date: '2026-08-05',
    dayName: 'Çarşamba (Bugün)',
    lunch: ['Günün Çorbası (Domates)', 'Tavuk Schnitzel', 'Patates Püresi', 'Soğuk Meyve Suyu'],
    dinner: ['Mercimek Çorbası', 'Karnıyarık', 'Bulgur Pilavı', 'Süzme Yoğurt'],
    calories: 860,
  },
  {
    date: '2026-08-06',
    dayName: 'Perşembe',
    lunch: ['Şehriye Çorbası', 'Kayseri Mantısı', 'Zeytinyağlı Enginar', 'Revani Tatlısı'],
    dinner: ['Düğün Çorbası', 'Etli Bezelye', 'Pirinç Pilavı', 'Komposto'],
    calories: 910,
  },
  {
    date: '2026-08-07',
    dayName: 'Cuma',
    lunch: ['Tavuk Suyu Çorba', 'Orman Kebabı', 'Pirinç Pilavı', 'Fırın Sütlaç'],
    dinner: ['Mercimek Çorbası', 'Balık Tava / Izgara', 'Patates Salatası', 'Tahin Helvası'],
    calories: 880,
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
      userName: 'Ahmet Y. (Mühendislik)',
      stars: 5,
      comment: 'Harput köfte ve pilav bugün harikaydı, aşçıların eline sağlık! 👏',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'r-2',
      userId: 'demo-2',
      userName: 'Zeynep K. (Tıp Fakültesi)',
      stars: 4,
      comment: 'Mercimek çorbası sıcaktı, sütlaç da çok kıvamındaydı.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'r-3',
      userId: 'demo-3',
      userName: 'Mehmet A. (İİBF)',
      stars: 5,
      comment: 'Öğle yemeği sırası hızlı ilerledi, yemekler gayet doyurucu.',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
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
