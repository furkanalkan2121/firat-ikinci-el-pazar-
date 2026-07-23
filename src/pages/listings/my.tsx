import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getUserListings, deleteListing, toggleListingSold, type Listing } from '../../lib/localStore';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m} dk. önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa. önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function MyListings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signin'); return; }
    getUserListings(user.uid).then(ls => { setListings(ls); setPageLoading(false); });
  }, [user, loading, router]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" ilanını silmek istediğinize emin misiniz?`)) return;
    setDeletingId(id);
    await deleteListing(id);
    setListings(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  if (loading || pageLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="fu-mark" style={{ margin: '0 auto 1rem', width: 48, height: 48 }}>FÜ</div>
            <p style={{ color: '#6B7280' }}>Yükleniyor…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)', padding: '2.5rem 1.25rem 4rem', minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Başlık */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>İlanlarım</h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {listings.length === 0 ? 'Henüz ilan eklemediniz.' : `${listings.length} aktif ilan`}
              </p>
            </div>
            <Link href="/listings/create" className="btn btn-primary">
              + Yeni İlan Ekle
            </Link>
          </div>

          {/* Boş durum */}
          {listings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '1rem', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
              <h2 style={{ fontWeight: 700, fontSize: '1.15rem', color: '#374151', marginBottom: '0.5rem' }}>Henüz ilan eklemediniz</h2>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                İlk ilanınızı ekleyerek satışa başlayın.
              </p>
              <Link href="/listings/create" className="btn btn-gold btn-lg">
                🚀 İlk İlanı Ekle
              </Link>
            </div>
          )}

          {/* İlan listesi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {listings.map(listing => (
              <div
                key={listing.id}
                style={{
                  background: '#fff',
                  borderRadius: '0.875rem',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                  display: 'flex',
                  transition: 'box-shadow 0.25s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-card)')}
              >
                {/* Görsel */}
                <div style={{ width: '140px', flexShrink: 0, background: '#F5E8E8', position: 'relative', overflow: 'hidden' }}>
                  {listing.images && listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1.2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* İçerik */}
                <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.625rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      {listing.category && <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>{listing.category}</span>}
                      {listing.isSold && <span className="badge" style={{ background: '#EF4444', color: '#fff', fontSize: '0.7rem' }}>🏷️ SATILDI</span>}
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{listing.createdAt ? timeAgo(listing.createdAt) : ''}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0, lineHeight: 1.3 }}>
                      {listing.title}
                    </h3>
                    {listing.description && (
                      <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {listing.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: listing.isSold ? '#9CA3AF' : '#8B1A1A', textDecoration: listing.isSold ? 'line-through' : 'none' }}>
                      {listing.price !== undefined ? `${listing.price.toLocaleString('tr-TR')} ₺` : 'Fiyatsız'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Gör
                      </Link>
                      <Link
                        href={`/listings/edit/${listing.id}`}
                        className="btn btn-gold btn-sm"
                      >
                        ✏️ Düzenle
                      </Link>
                      <button
                        onClick={async () => {
                          const newStatus = await toggleListingSold(listing.id!);
                          setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isSold: newStatus } : l));
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: listing.isSold ? '#22C55E' : '#E5E7EB', color: listing.isSold ? '#166534' : '#374151' }}
                      >
                        {listing.isSold ? '🔄 Aktif et' : '🏷️ Satıldı'}
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id!, listing.title)}
                        disabled={deletingId === listing.id}
                        style={{
                          padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem',
                          border: '1.5px solid #EF4444', background: deletingId === listing.id ? '#FEE2E2' : 'transparent',
                          color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.2s', boxShadow: 'none',
                        }}
                        onMouseEnter={e => { if (deletingId !== listing.id) { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; } }}
                        onMouseLeave={e => { if (deletingId !== listing.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#EF4444'; } }}
                      >
                        {deletingId === listing.id ? '…' : '🗑 Sil'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
}
