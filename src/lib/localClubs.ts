/**
 * localClubs.ts
 * Fırat Üniversitesi Öğrenci Kulüpleri, Toplulukları ve Kulüp Başvuru Veri Katmanı
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

export type ClubApplication = {
  id: string;
  clubName: string;
  category: 'Teknoloji & Mühendislik' | 'Kültür & Sanat' | 'Spor & Doğa' | 'Sosyal Sorumluluk' | 'Akademik';
  logoEmoji: string;
  applicantEmail: string;
  applicantName: string;
  studentNo: string;
  department: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const CLUBS_KEY = 'fu_clubs';
const APPLICATIONS_KEY = 'fu_club_applications';

const REAL_FU_CLUBS: Club[] = [
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
        date: '12 Ağustos 2026 - 14:00',
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
    id: 'club-fudak',
    name: 'FÜ Dağcılık & Doğa Sporları (FÜDAK)',
    category: 'Spor & Doğa',
    leaderEmail: 'fudak.baskan@firat.edu.tr',
    leaderName: 'Murat T. (Kulüp Başkanı)',
    description: 'Hazar Dağı tırmanışları, Harput doğa yürüyüşleri ve dağcılık eğitimleri topluluğu.',
    logoEmoji: '🏔️',
    memberCount: 290,
    instagram: '@fudak_official',
    events: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'club-siber',
    name: 'FÜ Siber Güvenlik Topluluğu',
    category: 'Teknoloji & Mühendislik',
    leaderEmail: 'siber.baskan@firat.edu.tr',
    leaderName: 'Burak A. (Kulüp Başkanı)',
    description: 'Beyaz şapkalı hekerlik, sızma testleri ve CTF yarışmalarına hazırlık kulübü.',
    logoEmoji: '🛡️',
    memberCount: 230,
    instagram: '@fusiber',
    events: [],
    createdAt: new Date().toISOString(),
  },
];

function initClubs(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(CLUBS_KEY)) {
    localStorage.setItem(CLUBS_KEY, JSON.stringify(REAL_FU_CLUBS));
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

/* ── KULÜP BAŞVURU SİSTEMİ (Yeni Kulüp Açma / Başkanlık Talebi) ── */

export function getClubApplications(): ClubApplication[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(APPLICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function submitClubApplication(app: Omit<ClubApplication, 'id' | 'status' | 'createdAt'>): ClubApplication {
  const apps = getClubApplications();
  const newApp: ClubApplication = {
    ...app,
    id: `app-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  apps.unshift(newApp);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  window.dispatchEvent(new CustomEvent('fu_club_apps_updated'));
  return newApp;
}

export function approveClubApplication(appId: string): void {
  const apps = getClubApplications();
  const index = apps.findIndex(a => a.id === appId);
  if (index !== -1) {
    const targetApp = apps[index];
    targetApp.status = 'approved';
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));

    // Kulübü sisteme resmi olarak ekle ve başvuran e-postasını başkan olarak ata
    const clubs = getClubs();
    const newClub: Club = {
      id: `club-${Date.now()}`,
      name: targetApp.clubName,
      category: targetApp.category,
      leaderEmail: targetApp.applicantEmail,
      leaderName: `${targetApp.applicantName} (Kulüp Başkanı)`,
      description: targetApp.description,
      logoEmoji: targetApp.logoEmoji || '🏛️',
      memberCount: 1,
      events: [],
      createdAt: new Date().toISOString(),
    };
    clubs.unshift(newClub);
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));

    window.dispatchEvent(new CustomEvent('fu_clubs_updated'));
    window.dispatchEvent(new CustomEvent('fu_club_apps_updated'));
  }
}

export function rejectClubApplication(appId: string): void {
  const apps = getClubApplications();
  const index = apps.findIndex(a => a.id === appId);
  if (index !== -1) {
    apps[index].status = 'rejected';
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent('fu_club_apps_updated'));
  }
}
