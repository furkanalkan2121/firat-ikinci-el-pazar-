/**
 * localNotes.ts
 * Fırat Üniversitesi Gerçek Ders Notları ve Çıkmış Sorular Havuzu
 */

export type CourseNote = {
  id: string;
  courseName: string;
  department: string;
  term: 'Vize' | 'Final' | 'Büt' | 'Ders Notu';
  year: string;
  uploaderName: string;
  uploaderId: string;
  fileUrl?: string;
  description: string;
  downloadsCount: number;
  createdAt: string;
};

const NOTES_KEY = 'fu_course_notes';

const REAL_FU_NOTES: CourseNote[] = [
  {
    id: 'note-1',
    courseName: 'Yazılım Mühendisliğine Giriş (YBM101)',
    department: 'Mühendislik Fakültesi',
    term: 'Vize',
    year: '2025-2026',
    uploaderName: 'Ahmet Y. (Yazılım Müh.)',
    uploaderId: 'demo-1',
    description: 'Yazılım yaşam döngüsü, UML diyagramları ve vize hazırlık test soruları.',
    downloadsCount: 142,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'note-2',
    courseName: 'Veri Yapıları & Algoritmalar (YBM203)',
    department: 'Mühendislik Fakültesi',
    term: 'Final',
    year: '2025-2026',
    uploaderName: 'Elif S. (Bilgisayar Müh.)',
    uploaderId: 'demo-2',
    description: 'Bağlı listeler, Ağaçlar (Binary Trees), Graf algoritmaları ve final çıkmış soruları.',
    downloadsCount: 198,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'note-3',
    courseName: 'Anatomi I - Kasa-İskelet Sistemi',
    department: 'Tıp Fakültesi',
    term: 'Ders Notu',
    year: '2025-2026',
    uploaderName: 'Zeynep K. (Tıp 2. Sınıf)',
    uploaderId: 'demo-3',
    description: 'Renkli Atlas ve Latin terim Türkçe açıklamalı Anatomi pratik sınav notu.',
    downloadsCount: 265,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'note-4',
    courseName: 'Mikro Ekonomi & Genel İktisat',
    department: 'İktisadi ve İdari Bilimler Fakültesi',
    term: 'Vize',
    year: '2024-2025',
    uploaderName: 'Mehmet A. (İktisat)',
    uploaderId: 'demo-4',
    description: 'Arz-Talep eğrileri, esneklik hesaplamaları ve soru bankası çözümleri.',
    downloadsCount: 88,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'note-5',
    courseName: 'Medya Hukuku & Telif Hakları',
    department: 'İletişim Fakültesi',
    term: 'Final',
    year: '2024-2025',
    uploaderName: 'Caner B. (Radyo TV)',
    uploaderId: 'demo-5',
    description: 'Basın hukuku, kişilik hakları ihlali ve geçmiş yıllar çıkmış final soruları.',
    downloadsCount: 64,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

function initNotes(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(NOTES_KEY)) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(REAL_FU_NOTES));
  }
}

export function getCourseNotes(): CourseNote[] {
  if (typeof window === 'undefined') return [];
  initNotes();
  const raw = localStorage.getItem(NOTES_KEY);
  const items: CourseNote[] = raw ? JSON.parse(raw) : [];
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addCourseNote(note: Omit<CourseNote, 'id' | 'downloadsCount' | 'createdAt'>): CourseNote {
  initNotes();
  const items = getCourseNotes();
  const newNote: CourseNote = {
    ...note,
    id: `note-${Date.now()}`,
    downloadsCount: 0,
    createdAt: new Date().toISOString(),
  };
  items.unshift(newNote);
  localStorage.setItem(NOTES_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('fu_notes_updated'));
  return newNote;
}

export function incrementNoteDownload(id: string): void {
  const items = getCourseNotes();
  const index = items.findIndex(n => n.id === id);
  if (index !== -1) {
    items[index].downloadsCount += 1;
    localStorage.setItem(NOTES_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('fu_notes_updated'));
  }
}
