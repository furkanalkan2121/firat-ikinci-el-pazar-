/**
 * localNotes.ts
 * Fırat Üniversitesi Ders Notları ve Çıkmış Sorular Havuzu
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

const INITIAL_NOTES: CourseNote[] = [
  {
    id: 'note-1',
    courseName: 'Calculus I (Matematik I)',
    department: 'Mühendislik Fakültesi',
    term: 'Vize',
    year: '2025-2026',
    uploaderName: 'Ahmet M.',
    uploaderId: 'demo-1',
    description: 'Türev, Limit ve Süreklilik çözümlü çıkmış sorular ve hoca notları.',
    downloadsCount: 42,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'note-2',
    courseName: 'Anatomi I (Kemik ve Kaslar)',
    department: 'Tıp Fakültesi',
    term: 'Ders Notu',
    year: '2025-2026',
    uploaderName: 'Zeynep K.',
    uploaderId: 'demo-2',
    description: 'Renkli ve şematik özet anlatım ders notları PDF.',
    downloadsCount: 89,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'note-3',
    courseName: 'Genel İktisat & Mikro Ekonomi',
    department: 'İktisadi ve İdari Bilimler Fakültesi',
    term: 'Final',
    year: '2024-2025',
    uploaderName: 'Caner B.',
    uploaderId: 'demo-3',
    description: 'Son 3 yılın final soruları ve detaylı çözümleri.',
    downloadsCount: 31,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

function initNotes(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(NOTES_KEY)) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(INITIAL_NOTES));
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
