/**
 * localSocial.ts
 * Fırat Üniversitesi Öğrenci Tanışma & Sosyal Ağ Veri Katmanı
 */

export type SocialProfile = {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  department: string;
  grade: string; // 1. Sınıf, 2. Sınıf vb.
  goal: 'Ders Çalışma 📚' | 'Proje Ekibi 💻' | 'Ev / Oda Arkadaşı 🏠' | 'Spor & Aktivite ⚽' | 'Kahve & Sohbet ☕' | 'Diğer';
  bio: string;
  hobbies: string[];
  createdAt: string;
};

const SOCIAL_KEY = 'fu_social_profiles';

const FAKE_PROFILES: SocialProfile[] = [
  {
    id: 'soc-1',
    userId: 'demo-user2',
    userEmail: 'ahmet.yazilim@firat.edu.tr',
    name: 'Ahmet Y.',
    department: 'Yazılım Mühendisliği',
    grade: '3. Sınıf',
    goal: 'Proje Ekibi 💻',
    bio: 'Python ve React ile ilgileniyorum. Bitirme projesi ve hackathonlar için ekip arkadaşı arıyorum!',
    hobbies: ['Kodlama', 'Satranç', 'Valorant'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'soc-2',
    userId: 'demo-user3',
    userEmail: 'zeynep.tip@firat.edu.tr',
    name: 'Zeynep K.',
    department: 'Tıp Fakültesi',
    grade: '2. Sınıf',
    goal: 'Ders Çalışma 📚',
    bio: 'Kütüphanede Anatomi ve Biyokimya derslerine birlikte çalışabileceğimiz düzenli arkadaş arıyorum.',
    hobbies: ['Kitap Okuma', 'Filtre Kahve', 'Müzik'],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'soc-3',
    userId: 'demo-user4',
    userEmail: 'mehmet.iibf@firat.edu.tr',
    name: 'Mehmet A.',
    department: 'İktisadi ve İdari Bilimler Fakültesi',
    grade: '4. Sınıf',
    goal: 'Spor & Aktivite ⚽',
    bio: 'Haftalık halı saha maçlarına veya akşam yürüyüşlerine katılabilecek arkadaşlar yazabilir.',
    hobbies: ['Futbol', 'Yüzme', 'Kamp'],
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

function initFakeSocial(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(SOCIAL_KEY)) {
    localStorage.setItem(SOCIAL_KEY, JSON.stringify(FAKE_PROFILES));
  }
}

export function getSocialProfiles(): SocialProfile[] {
  if (typeof window === 'undefined') return [];
  initFakeSocial();
  const raw = localStorage.getItem(SOCIAL_KEY);
  const items: SocialProfile[] = raw ? JSON.parse(raw) : [];
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addSocialProfile(profile: Omit<SocialProfile, 'id' | 'createdAt'>): SocialProfile {
  initFakeSocial();
  const items = getSocialProfiles();
  const newProfile: SocialProfile = {
    ...profile,
    id: `soc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  items.unshift(newProfile);
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('fu_social_updated'));
  return newProfile;
}

export function deleteSocialProfile(id: string): void {
  const items = getSocialProfiles().filter(p => p.id !== id);
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('fu_social_updated'));
}
