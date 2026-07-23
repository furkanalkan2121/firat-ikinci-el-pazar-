import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getListings, Listing } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';

function ListingCard({ item }: { item: Listing }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link
      href={`/listings/${item.id}`}
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
    <article
      className="card animate-slide-up"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}
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
        {item.images && item.images[0] && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.images[0]}
            alt={item.title}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '0.5rem',
              color: '#C9A227',
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

        {/* Price overlay */}
        {item.price !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'rgba(139,26,26,0.92)',
              backdropFilter: 'blur(6px)',
              color: '#fff',
              padding: '0.3rem 0.7rem',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {item.price.toLocaleString('tr-TR')} ₺
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
        <h2
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: '#111827',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
          }}
        >
          {item.title}
        </h2>

        {item.description && (
          <p
            style={{
              fontSize: '0.83rem',
              color: '#6B7280',
              lineHeight: 1.6,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as any,
              flex: 1,
            }}
          >
            {item.description}
          </p>
        )}

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.625rem',
            paddingTop: '0.625rem',
            borderTop: '1px solid #F3F4F6',
          }}
        >
          <span
            style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            Yeni ilan
          </span>
          <span className="badge badge-red">{item.category ?? 'İkinci El'}</span>
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    getListings()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(
    it =>
      it.title?.toLowerCase().includes(search.toLowerCase()) ||
      it.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      {/* ── Hero Section ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #6B1010 0%, #8B1A1A 45%, #9B2020 75%, #7A1515 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '4rem 0 3.5rem',
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
              width: c.size,
              height: c.size,
              borderRadius: '50%',
              border: '2px solid #C9A227',
              opacity: c.opacity,
              top: (c as any).top,
              bottom: (c as any).bottom,
              left: (c as any).left,
              right: (c as any).right,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div className="page-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(201,162,39,0.15)',
              border: '1px solid rgba(201,162,39,0.35)',
              borderRadius: '999px',
              padding: '0.3rem 1rem',
              color: '#E8C547',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A227', animation: 'pulse-ring 2s infinite' }} />
            Fırat Üniversitesi Öğrenci Platformu
          </div>

          <h1
            style={{
              color: '#fff',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '1rem',
            }}
          >
            İkinci El Eşya<br />
            <span className="text-gradient-gold">Alım &amp; Satım</span>
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.70)',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
              maxWidth: '520px',
              margin: '0 auto 2rem',
              lineHeight: 1.7,
            }}
          >
            Fırat Üniversitesi topluluğunda güvenli ikinci el eşya al ve sat. Öğrenciler için, öğrenciler tarafından.
          </p>

          {/* Search bar */}
          <div
            style={{
              position: 'relative',
              maxWidth: '520px',
              margin: '0 auto 1.5rem',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                pointerEvents: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              className="form-input"
              type="text"
              placeholder="İlan ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: '2.75rem',
                borderRadius: '999px',
                border: '2px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.10)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link href="/listings/create" className="btn btn-gold btn-lg">
                + Hemen İlan Ver
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className="btn btn-gold btn-lg">
                  Hemen Başla
                </Link>
                <Link href="/auth/signin" className="btn btn-ghost btn-lg">
                  Giriş Yap
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #F3F4F6',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="page-container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            padding: '1rem 1.25rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Aktif İlan', value: items.length, icon: '📦' },
            { label: 'Kategori', value: '10+', icon: '🏷️' },
            { label: 'Güvenli Platform', value: '✓', icon: '🔒' },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#8B1A1A', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Listings ── */}
      <section style={{ padding: '2.5rem 0 4rem' }}>
        <div className="page-container">
          {/* Section header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#111827', letterSpacing: '-0.01em' }}>
                Güncel İlanlar
              </h2>
              {!loading && (
                <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '0.2rem' }}>
                  {filtered.length} ilan bulundu
                </p>
              )}
            </div>
            {user && (
              <Link href="/listings/create" className="btn btn-primary btn-sm">
                + İlan Ekle
              </Link>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '5rem 1rem',
                color: '#9CA3AF',
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="1"
                style={{ margin: '0 auto 1.25rem', display: 'block' }}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#374151', marginBottom: '0.5rem' }}>
                {search ? 'Arama sonucu bulunamadı' : 'Henüz ilan yok'}
              </p>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {search ? 'Farklı bir arama terimi deneyin.' : 'İlk ilanı eklemek ister misiniz?'}
              </p>
              {!search && user && (
                <Link href="/listings/create" className="btn btn-primary">
                  İlk İlanı Ekle
                </Link>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filtered.map(it => (
                <ListingCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
