/**
 * localStore.ts
 * Firebase Firestore yerine localStorage kullanan veri katmanı.
 * Sayfa yenilemede veriler kaybolmaz.
 */

export type Listing = {
  id?: string;
  title: string;
  description?: string;
  price?: number;
  images?: string[];
  ownerId?: string;
  category?: string;
  createdAt?: string;
  isSold?: boolean;
};

const LISTINGS_KEY = 'fu_listings';

/* ── Placeholder görseller (SVG, internet gerektirmez) ── */
function makePlaceholder(bg: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <rect width="400" height="300" fill="${bg}" rx="12"/>
    <text x="200" y="155" text-anchor="middle" dominant-baseline="middle"
      font-size="88" font-family="system-ui, sans-serif">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ── Sahte başlangıç verileri ── */
const FAKE_LISTINGS: Listing[] = [
  {
    id: 'demo-1',
    title: 'Calculus I & II El Yazısı Ders Notları',
    description:
      'Fırat Üniversitesi Mühendislik Fakültesi için hazırlanmış detaylı el yazısı calculus notları. Türev, integral, limit konuları eksiksiz. Çok temiz kullanılmış, hiç üstü çizili değil.',
    price: 50,
    images: [makePlaceholder('#FEF3C7', '📚')],
    ownerId: 'demo-user',
    category: 'Kitap & Ders Materyali',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Lenovo ThinkPad E14 — i5 / 8GB / 512GB SSD',
    description:
      '2022 model. Intel i5-1135G7, 8 GB RAM, 512 GB NVMe SSD. Batarya kapasitesi %88. Kutusu ve orijinal şarj adaptörü mevcuttur. Çift ekran desteği var.',
    price: 13500,
    images: [makePlaceholder('#DBEAFE', '💻')],
    ownerId: 'demo-user',
    category: 'Elektronik',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Tek Kişilik Yatak + Baza (Temiz)',
    description:
      'Yurt odasından çıkma, 90x190 cm. Ortopedik yay yok, düz sünger. Baza dahil. Elazığ içi kargo yapılabilir. Üst katta olduğu için yardımlı taşıma gerekir.',
    price: 950,
    images: [makePlaceholder('#F0FDF4', '🛋️')],
    ownerId: 'demo-user2',
    category: 'Mobilya & Ev Eşyası',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Python ile Veri Bilimi — O\'Reilly Orijinal',
    description:
      'Türkçe çeviri, 520 sayfa. NumPy, Pandas, Matplotlib konuları mükemmel anlatılmış. Üzerinde kalem işareti yok. Kapakta küçük bir çizik var, içi tertemiz.',
    price: 120,
    images: [makePlaceholder('#F5F3FF', '📖')],
    ownerId: 'demo-user3',
    category: 'Kitap & Ders Materyali',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Casio FX-991ES Plus Bilimsel Hesap Makinesi',
    description:
      'Mühendislik sınavları için ideal. Matris, integral, türev, istatistik fonksiyonları mevcut. Pili yeni değiştirildi. Kılıfıyla birlikte.',
    price: 280,
    images: [makePlaceholder('#FFF7ED', '🔢')],
    ownerId: 'demo-user2',
    category: 'Elektronik',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-6',
    title: 'Sony WH-1000XM4 Bluetooth Kulaklık',
    description:
      'Gürültü engelleme özellikli. Tam şarjda 30 saat kullanım. Kutusunda, 3.5mm kablosu ve uçak adaptörü dahil. Küçük çizikler var ama ses kalitesi mükemmel.',
    price: 3200,
    images: [makePlaceholder('#FDF2F8', '🎧')],
    ownerId: 'demo-user4',
    category: 'Elektronik',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'demo-7',
    title: 'Çalışma Masası + Sandalye Seti',
    description:
      '120x60 cm MDF çalışma masası, yükseklik ayarlı sandalye. İkisi birlikte satılmaktadır. Toplu alıma indirim yapılır. Kampüse 5 dk. uzaklıkta teslim edilebilir.',
    price: 750,
    images: [makePlaceholder('#ECFDF5', '🪑')],
    ownerId: 'demo-user3',
    category: 'Mobilya & Ev Eşyası',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'demo-8',
    title: 'Mühendislik 1. Sınıf Kitap Seti (8 Kitap)',
    description:
      'Fizik, Kimya, Matematik, Lojik Devreler, Bilgisayara Giriş ve daha fazlası. Hepsi orijinal baskı. Birkaçının üzerinde kurşun kalem notları var, silinebilir.',
    price: 350,
    images: [makePlaceholder('#FEF9C3', '📦')],
    ownerId: 'demo-user5',
    category: 'Kitap & Ders Materyali',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

/* ── Başlangıç verilerini yükle (sadece ilk açılışta) ── */
function initFakeData(): void {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(LISTINGS_KEY);
  if (!existing) {
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(FAKE_LISTINGS));
  }
}

/* ── Public API ── */

export function getListings(): Promise<Listing[]> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve([]);
    initFakeData();
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    // En yeniden eskiye sırala
    items.sort((a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
    resolve(items);
  });
}

export function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Promise<string> {
  return new Promise(resolve => {
    initFakeData();
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    const id = `listing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    items.unshift({ ...listing, id, createdAt: new Date().toISOString() });
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(items));
    resolve(id);
  });
}

export function deleteListing(id: string): Promise<void> {
  return new Promise(resolve => {
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(items.filter(l => l.id !== id)));
    resolve();
  });
}

export function getListing(id: string): Promise<Listing | null> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(null);
    initFakeData();
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    resolve(items.find(l => l.id === id) ?? null);
  });
}

export function getUserListings(userId: string): Promise<Listing[]> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve([]);
    initFakeData();
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    resolve(
      items
        .filter(l => l.ownerId === userId)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    );
  });
}

export function updateListing(id: string, data: Partial<Omit<Listing, 'id'>>): Promise<void> {
  return new Promise((resolve, reject) => {
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    const index = items.findIndex(l => l.id === id);
    if (index === -1) return reject(new Error('İlan bulunamadı.'));
    items[index] = { ...items[index], ...data };
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(items));
    resolve();
  });
}

export function toggleListingSold(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const raw = localStorage.getItem(LISTINGS_KEY);
    const items: Listing[] = raw ? JSON.parse(raw) : [];
    const index = items.findIndex(l => l.id === id);
    if (index === -1) return reject(new Error('İlan bulunamadı.'));
    const newStatus = !items[index].isSold;
    items[index].isSold = newStatus;
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(items));
    resolve(newStatus);
  });
}
