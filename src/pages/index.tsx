import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { getListings, Listing } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import { isFavorite, toggleFavorite } from '../lib/localFavorites';
import { useToast } from '../context/ToastContext';
import { useAuthGate } from '../lib/authGate';
import { FU_FACULTIES, FU_CAMPUS_LOCATIONS, INITIAL_ANNOUNCEMENTS } from '../lib/localStore';

const CATEGORIES = [
  { label: 'Tümü',                  emoji: '✨' },
  { label: 'Kitap & Ders Materyali', emoji: '📚' },
  { label: 'Elektronik',             emoji: '💻' },
  { label: 'Mobilya & Ev Eşyası',   emoji: '🛋️' },
  { label: 'Giyim & Aksesuar',      emoji: '👕' },
  { label: 'Spor & Outdoor',        emoji: '⚽' },
  { label: 'Diğer',                 emoji: '📦' },
];

function ListingCard({ item }: { item: Listing }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const requireAuth = useAuthGate();
  const [imgErr, setImgErr] = useState(false);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let active = true;
    if (user && item.id) {
      isFavorite(user.uid, item.id).then(v => { if (active) setFav(v); });
    } else {
      setFav(false);
    }
    return () => { active = false; };
  }, [user, item.id]);

  const handleFavClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth('Favorilere eklemek için lütfen giriş yapın.')) return;
    if (!user || !item.id) return;
    const isNowFav = await toggleFavorite(user.uid, item.id);
    setFav(isNowFav);
    showToast(isNowFav ? 'Favorilere eklendi! ❤️' : 'Favorilerden çıkarıldı.', isNowFav ? 'success' : 'info');
  };

  return (
    <Link
      href={`/listings/${item.id}`}
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <article
        className="card animate-slide-up"
        style={{
          display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer',
          opacity: item.isSold ? 0.75 : 1, position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Image */}
        <div
          style={{
            height: '200px',
            background: 'linear-gradient(135deg, #F5E8E8 0%, #F0D8D8 100%)',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Kalp Butonu */}
          <button
            onClick={handleFavClick}
            title={fav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            style={{
              position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10,
              width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {fav ? '❤️' : '🤍'}
          </button>

          {item.images && item.images[0] && !imgErr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.images[0]}
              alt={item.title}
              onError={() => setImgErr(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease',
                filter: item.isSold ? 'grayscale(40%)' : 'none'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ) : (
            <div
              style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '0.5rem', color: '#C9A227',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500 }}>Görsel yok</span>
            </div>
          )}

          {/* Sold Overlay */}
          {item.isSold && (
            <div
              style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span style={{
                background: '#EF4444', color: '#fff', padding: '0.35rem 1rem',
                borderRadius: '0.375rem', fontWeight: 900, fontSize: '0.9rem',
                letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transform: 'rotate(-5deg)'
              }}>
                SATILDI
              </span>
            </div>
          )}

          {/* Price overlay */}
          {item.price !== undefined && (
            <div
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: item.isSold ? 'rgba(107,114,128,0.92)' : 'rgba(139,26,26,0.92)',
                backdropFilter: 'blur(6px)', color: '#fff', padding: '0.3rem 0.7rem',
                borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                textDecoration: item.isSold ? 'line-through' : 'none'
              }}
            >
              {item.price.toLocaleString('tr-TR')} ₺
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {item.isFeatured && (
              <span className="badge" style={{ background: '#F59E0B', color: '#fff', fontSize: '0.68rem', fontWeight: 800 }}>
                ⭐ Vitrin İlanı
              </span>
            )}
            <span className="badge badge-red">{item.category ?? 'İkinci El'}</span>
            {item.allowTrade && (
              <span className="badge" style={{ background: '#059669', color: '#fff', fontSize: '0.68rem' }}>
                🤝 Nakit &amp; Takas
              </span>
            )}
            {item.isExchange && (
              <span className="badge" style={{ background: '#D97706', color: '#fff', fontSize: '0.68rem' }}>
                📚 Takas İlanı
              </span>
            )}
            {(item.ownerId?.includes('@firat.edu.tr') || item.ownerId?.includes('@ogr.firat.edu.tr') || item.ownerId === 'demo-user') && (
              <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.68rem', border: '1px solid #FDE68A' }}>
                🎓 FÜ Öğrencisi
              </span>
            )}
          </div>

          <h2
            style={{
              fontWeight: 700, fontSize: '1rem', color: '#111827', lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
            }}
          >
            {item.title}
          </h2>

          {item.department && (
            <div style={{ fontSize: '0.73rem', color: '#8B1A1A', fontWeight: 600 }}>
              🏛️ {item.department}
            </div>
          )}

          {item.location && (
            <div style={{ fontSize: '0.73rem', color: '#059669', fontWeight: 600 }}>
              📍 {item.location}
            </div>
          )}

          {item.description && (
            <p
              style={{
                fontSize: '0.83rem', color: '#6B7280', lineHeight: 1.6, overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, flex: 1,
              }}
            >
              {item.description}
            </p>
          )}

          {/* Footer row */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid #F3F4F6',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#8B1A1A', fontWeight: 700 }}>İncele →</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const saved = localStorage.getItem('fu_compare_id');
                if (!saved) {
                  localStorage.setItem('fu_compare_id', item.id!);
                  showToast(`"${item.title}" 1. ilan olarak seçildi. Karşılaştırmak için 2. ilanı seçin. ⚖️`, 'info');
                } else if (saved === item.id) {
                  showToast('Bu ilan zaten 1. sırada seçili. Farklı bir ilan seçin.', 'info');
                } else {
                  localStorage.removeItem('fu_compare_id');
                  window.location.href = `/karsilastir?id1=${saved}&id2=${item.id}`;
                }
              }}
              style={{
                background: '#F3F4F6', border: 'none', color: '#374151',
                padding: '0.25rem 0.6rem', borderRadius: '0.375rem',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: 'none', transition: 'background 0.2s',
              }}
            >
              ⚖️ Karşılaştır
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ height: 20, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, borderRadius: 4, width: '80%' }} />
        <div className="skeleton" style={{ height: 14, borderRadius: 4, width: '60%' }} />
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtre durumları
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('Tümü');
  const [department, setDepartment]     = useState('Tüm Bölümler');
  const [location, setLocation]         = useState('Tüm Kampüs Noktaları');
  const [onlyExchange, setOnlyExchange] = useState(false);
  const [minPrice, setMinPrice]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [sortBy, setSortBy]             = useState<'newest' | 'price-asc' | 'price-desc' | 'oldest'>('newest');
  const [hideSold, setHideSold]         = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    getListings()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filtre değiştiğinde görünen ilan sayısını sıfırla
  useEffect(() => {
    setVisibleCount(6);
  }, [search, category, department, location, onlyExchange, minPrice, maxPrice, sortBy, hideSold]);

  // Gelişmiş filtreleme ve sıralama mantığı
  const filteredItems = useMemo(() => {
    return items
      .filter(it => {
        // Arama filtresi (Başlık veya açıklama)
        const q = search.trim().toLowerCase();
        const matchesSearch = !q ||
          it.title?.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q);

        // Kategori filtresi
        const matchesCategory = category === 'Tümü' || it.category === category;

        // Bölüm filtresi
        const matchesDept = department === 'Tüm Bölümler' || it.department === department;

        // Kampüs Lokasyon filtresi
        const matchesLoc = location === 'Tüm Kampüs Noktaları' || (it.location || 'Rektörlük Kampüsü') === location;

        // Sadece Takas filtresi
        const matchesExchange = !onlyExchange || it.isExchange || it.allowTrade;

        // Fiyat aralığı filtresi
        const price = it.price ?? 0;
        const min = minPrice !== '' ? Number(minPrice) : null;
        const max = maxPrice !== '' ? Number(maxPrice) : null;
        const matchesMinPrice = min === null || price >= min;
        const matchesMaxPrice = max === null || price <= max;

        // Satılanları gizle filtresi
        const matchesSold = !hideSold || !it.isSold;

        return matchesSearch && matchesCategory && matchesDept && matchesLoc && matchesExchange && matchesMinPrice && matchesMaxPrice && matchesSold;
      })
      .sort((a, b) => {
        // Vitrin İlanları (isFeatured) en üstte görünsün
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        if (sortBy === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
        if (sortBy === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
        if (sortBy === 'oldest') return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      });
  }, [items, search, category, department, location, onlyExchange, minPrice, maxPrice, sortBy, hideSold]);

  const clearFilters = () => {
    setSearch('');
    setCategory('Tümü');
    setDepartment('Tüm Bölümler');
    setLocation('Tüm Kampüs Noktaları');
    setOnlyExchange(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setHideSold(false);
  };

  const hasActiveFilters = search || category !== 'Tümü' || department !== 'Tüm Bölümler' || location !== 'Tüm Kampüs Noktaları' || onlyExchange || minPrice || maxPrice || hideSold || sortBy !== 'newest';

  return (
    <Layout>
      {/* ── Hero Section ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #6B1010 0%, #8B1A1A 45%, #9B2020 75%, #7A1515 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '3.5rem 0 3rem',
        }}
      >
        {/* Decorative circles */}
        {[
          { size: 320, top: -80, right: -60, opacity: 0.06 },
          { size: 200, bottom: -60, left: 80, opacity: 0.08 },
          { size: 140, top: 20, left: '40%', opacity: 0.05 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: c.size, height: c.size, borderRadius: '50%',
              border: '2px solid #C9A227', opacity: c.opacity,
              top: (c as any).top, bottom: (c as any).bottom,
              left: (c as any).left, right: (c as any).right,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div className="page-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.35)',
              borderRadius: '999px', padding: '0.3rem 1rem', color: '#E8C547',
              fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: '1.25rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A227' }} />
            Fırat Üniversitesi Öğrenci Platformu
          </div>

          <h1
            style={{
              color: '#fff', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem',
            }}
          >
            İkinci El Eşya<br />
            <span className="text-gradient-gold">Alım &amp; Satım</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Ders kitapları, elektronik cihazlar, ev eşyaları ve daha fazlası. Kampüs içi güvenli alışveriş.
          </p>

          {/* Search Bar */}
          <div style={{ maxWidth: '640px', margin: '0 auto 1.5rem', position: 'relative' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', background: '#fff',
                borderRadius: '0.875rem', padding: '0.375rem 0.375rem 0.375rem 1.125rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2.5" style={{ flexShrink: 0, marginRight: '0.75rem' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ne arıyorsunuz? (örn. Calculus kitabı, Lenovo laptop...)"
                style={{
                  border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem',
                  color: '#111827', background: 'transparent', fontFamily: 'inherit',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.5rem', fontSize: '1rem', boxShadow: 'none' }}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(f => !f)}
                className="btn btn-sm"
                style={{
                  background: showFilters ? '#8B1A1A' : '#F3F4F6',
                  color: showFilters ? '#fff' : '#374151',
                  borderRadius: '0.625rem', padding: '0.6rem 0.9rem',
                  fontWeight: 600, fontSize: '0.82rem', border: 'none', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}
              >
                ⚙️ Filtreler
              </button>
            </div>
          </div>

          {/* ── Kategori Chip Butonları ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', maxWidth: 850, margin: '0 auto' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setCategory(cat.label)}
                style={{
                  padding: '0.45rem 0.9rem', borderRadius: '999px',
                  border: category === cat.label ? '1.5px solid #C9A227' : '1px solid rgba(255,255,255,0.2)',
                  background: category === cat.label ? '#C9A227' : 'rgba(255,255,255,0.1)',
                  color: category === cat.label ? '#6B1010' : '#fff',
                  fontWeight: category === cat.label ? 700 : 500, fontSize: '0.82rem',
                  cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: 'none',
                }}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FÜ Öğrenci Toplulukları Duyuruları ── */}
      <section style={{ background: '#FFFDF9', borderBottom: '1px solid #F3F4F6', padding: '1.5rem 0' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📣</span>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                FÜ Öğrenci Toplulukları &amp; Kampüs Duyuruları
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#8B1A1A', fontWeight: 600 }}>Etkinlikler &amp; Kitap Takas Günleri</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {INITIAL_ANNOUNCEMENTS.map(ann => (
              <div
                key={ann.id}
                style={{
                  background: '#fff', padding: '1rem', borderRadius: '0.75rem',
                  border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex', flexDirection: 'column', gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8B1A1A', background: '#FFF5F5', padding: '0.15rem 0.5rem', borderRadius: '0.375rem' }}>
                    {ann.clubName}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{ann.date}</span>
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', margin: '0.2rem 0 0' }}>
                  {ann.emoji} {ann.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#4B5563', margin: 0, lineHeight: 1.4 }}>
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filtreler & Sıralama Barı ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>

            {/* Sol: Aktif Filtre İndikatörleri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                {filteredItems.length} İlan Listeleniyor
              </span>
              {category !== 'Tümü' && (
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>
                  {category} ✕
                </span>
              )}
              {department !== 'Tüm Bölümler' && (
                <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.75rem' }}>
                  🏛️ {department} ✕
                </span>
              )}
              {onlyExchange && (
                <span className="badge" style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem' }}>
                  🤝 Sadece Takas ✕
                </span>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{ background: 'none', border: 'none', color: '#8B1A1A', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, boxShadow: 'none' }}
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            {/* Sağ: Sıralama Dropdown ve Takas / Satılanlar Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem', color: '#065F46', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={onlyExchange}
                  onChange={e => setOnlyExchange(e.target.checked)}
                  style={{ accentColor: '#059669', cursor: 'pointer' }}
                />
                🤝 Sadece Takas İlanları
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem', color: '#4B5563', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={hideSold}
                  onChange={e => setHideSold(e.target.checked)}
                  style={{ accentColor: '#8B1A1A', cursor: 'pointer' }}
                />
                Satılanları Gizle
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 500 }}>Sırala:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB',
                    background: '#fff', fontSize: '0.82rem', fontWeight: 600, color: '#374151',
                    outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <option value="newest">En Yeniler</option>
                  <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                  <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                  <option value="oldest">En Eskiler</option>
                </select>
              </div>
            </div>
          </div>

          {/* Açılır Kapanır Detaylı Filtre Çubuğu (Bölüm + Konum + Fiyat Min/Max) */}
          {showFilters && (
            <div className="animate-slide-up" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #E5E7EB', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Fakülte / Bölüm Seçimi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Bölüm / Fakülte:</span>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB',
                    fontSize: '0.82rem', outline: 'none', background: '#fff', fontFamily: 'inherit'
                  }}
                >
                  {FU_FACULTIES.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>

              {/* Kampüs Teslimat Noktası */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>📍 Teslimat Noktası:</span>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB',
                    fontSize: '0.82rem', outline: 'none', background: '#fff', fontFamily: 'inherit'
                  }}
                >
                  {FU_CAMPUS_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Fiyat Min / Max */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Fiyat Aralığı:</span>
                <input
                  type="number"
                  placeholder="Min ₺"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  style={{ width: '100px', padding: '0.35rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB', fontSize: '0.82rem', outline: 'none' }}
                />
                <span style={{ color: '#9CA3AF' }}>-</span>
                <input
                  type="number"
                  placeholder="Max ₺"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  style={{ width: '100px', padding: '0.35rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── İlanlar Grid ── */}
      <section style={{ padding: '3rem 0 5rem', background: '#F9FAFB' }}>
        <div className="page-container">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonCard key={n} />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '1rem', boxShadow: 'var(--shadow-card)', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Aramanıza Uygun İlan Bulunamadı</h3>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Farklı anahtar kelimeler veya filtreler deneyebilirsiniz.</p>
              <button type="button" onClick={clearFilters} className="btn btn-primary">
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                {filteredItems.slice(0, visibleCount).map(item => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>

              {/* Daha Fazla Göster Butonu */}
              {visibleCount < filteredItems.length && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="btn btn-outline btn-lg"
                    style={{ background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 700 }}
                  >
                    ⬇️ Daha Fazla İlan Yükle ({filteredItems.length - visibleCount} İlan Kaldı)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
