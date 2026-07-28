/**
 * localClubs.ts
 * Fırat Üniversitesi Öğrenci Kulüpleri ve Toplulukları Veri Katmanı
 */

export type ClubEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
};

export type Club = {
  id: string;
  name: string;
  category: 'Teknoloji & Mühendislik' | 'Kültür & Sanat' | 'Spor & Doğa' | 'Sosyal Sorumluluk' | 'Akademik';
  leaderEmail: string; // Kulüp Başkanının e-postası (Düzenleme yetkisi için)
  leaderName: string;
  description: string;
  logoEmoji: string;
  memberCount: number;
  instagram?: string;
  events: ClubEvent[];
  createdAt: string;
};

const CLUBS_KEY = 'fu_clubs';

const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-yazilim',
    name: 'FÜ Yazılım & Bilişim Kulübü',
    category: 'Teknoloji & Mühendislik',
    leaderEmail: 'yazilim.baskan@firat.edu.tr',
    leaderName: 'Ahmet Y. (Kulüp Başkanı)',
    description: 'Fırat Üniversitesi öğrencilerine yazılım, yapay zeka, web geliştirme ve hackathon eğitimleri düzenleyen teknoloji topluluğu.',
    logoEmoji: '💻',
    memberCount: 340,
    instagram: '@fuyazilim',
    events: [
      {
        id: 'ev-1',
        title: 'React & Next.js Sıfırdan İleri Seviye Workshop',
        date: '30 Temmuz 2026 - 14:00',
        location: 'Mühendislik Amfi-2',
        description: 'Tüm FÜ öğrencilerine açık uygulamalı web geliştirme atölyesi.',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'club-ieee',
    name: 'IEEE Fırat Öğrenci Kolu',
    category: 'Teknoloji & Mühendislik',
    leaderEmail: 'ieee.baskan@firat.edu.tr',
    leaderName: 'Zeynep K. (Kulüp Başkanı)',
    description: 'Dünyanın en büyük teknik organizasyonunun Fırat Üniversitesi öğrenci temsilciliği.',
    logoEmoji: '⚡',
    memberCount: 520,
    instagram: '@ieeefirat',
    events: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'club-tiyatro',
    name: 'FÜ Tiyatro & Sahne Sanatları',
    category: 'Kültür & Sanat',
    leaderEmail: 'tiyatro.baskan@firat.edu.tr',
    leaderName: 'Caner B. (Kulüp Başkanı)',
    description: 'Oyunculuk, senaryo yazımı ve dönem sonu tiyatro gösterileri düzenleyen sanat topluluğu.',
    logoEmoji: '🎭',
    memberCount: 180,
    instagram: '@futiyatro',
    events: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'club-kizilay',
    name: 'Genç Kızılay FÜ Topluluğu',
    category: 'Sosyal Sorumluluk',
    leaderEmail: 'kizilay.baskan@firat.edu.tr',
    leaderName: 'Elif S. (Kulüp Başkanı)',
    description: 'Kan bağışı kampanyaları, yardım organizasyonları ve sosyal sorumluluk projeleri.',
    logoEmoji: '🔴',
    memberCount: 410,
    instagram: '@genckizilayfirat',
    events: [],
    createdAt: new Date().toISOString(),
  },
];

function initClubs(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(CLUBS_KEY)) {
    localStorage.setItem(CLUBS_KEY, JSON.stringify(INITIAL_CLUBS));
  }
}

export function getClubs(): Club[] {
  if (typeof window === 'undefined') return [];
  initClubs();
  const raw = localStorage.getItem(CLUBS_KEY);
  const items: Club[] = raw ? JSON.parse(raw) : [];
  return items;
}

export function getClubById(id: string): Club | null {
  const clubs = getClubs();
  return clubs.find(c => c.id === id) || null;
}

export function updateClub(id: string, patch: Partial<Club>): void {
  const clubs = getClubs();
  const index = clubs.findIndex(c => c.id === id);
  if (index !== -1) {
    clubs[index] = { ...clubs[index], ...patch };
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
    window.dispatchEvent(new CustomEvent('fu_clubs_updated'));
  }
}

export function addClubEvent(clubId: string, event: Omit<ClubEvent, 'id'>): void {
  const clubs = getClubs();
  const index = clubs.findIndex(c => c.id === clubId);
  if (index !== -1) {
    const newEvent: ClubEvent = {
      ...event,
      id: `ev-${Date.now()}`,
    };
    clubs[index].events.unshift(newEvent);
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
    window.dispatchEvent(new CustomEvent('fu_clubs_updated'));
  }
}

export function joinClub(clubId: string): void {
  const clubs = getClubs();
  const index = clubs.findIndex(c => c.id === clubId);
  if (index !== -1) {
    clubs[index].memberCount += 1;
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
    window.dispatchEvent(new CustomEvent('fu_clubs_updated'));
  }
}
