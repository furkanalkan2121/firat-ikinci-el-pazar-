import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getFavorites, toggleFavorite } from '../lib/localFavorites';
import { getListings, type Listing } from '../lib/localStore';
import { useToast } from '../context/ToastContext';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [favoriteItems, setFavoriteItems] = useState<Listing[]>([]);
  const [pageReady, setPageReady] = useState(false);

  const loadFavorites = async () => {
    if (!user) return;
    const favIds = getFavorites(user.uid);
    const allListings = await getListings();
    const filtered = allListings.filter(item => item.id && favIds.includes(item.id));
    setFavoriteItems(filtered);
    setPageReady(true);
  };

  useEffect(() => {
    if (loading) return;
    if (user) {
      loadFavorites();
    } else {
      setPageReady(true);
    }
  }, [user, loading]);

  const handleRemoveFavorite = (listingId: string, title: string) => {
    if (!user) return;
    toggleFavorite(user.uid, listingId);
    setFavoriteItems(prev => prev.filter(item => item.id !== listingId));
    showToast(`"${title}" favorilerinizden çıkarıldı.`, 'info');
  };

  if (loading || !pageReady) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="fu-mark" style={{ width: 48, height: 48 }}>FÜ</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Favorileri Görmek İçin Giriş Yapın</h1>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Beğendiğiniz ilanları favorilerinize eklemek ve takip etmek için giriş yapmalısınız.</p>
          <Link href="/auth/signin" className="btn btn-primary">Giriş Yap</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                Favorilerim ❤️
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Beğendiğiniz ve daha sonra incelemek istediğiniz ilanlar.
              </p>
            </div>
            <span className="badge badge-red" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
              {favoriteItems.length} İlan Kayıtlı
            </span>
          </div>

          {favoriteItems.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', border: 'none' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🤍</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Henüz Favori İlanınız Yok</h2>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>İlan kartlarındaki kalp ikonuna tıklayarak beğendiğiniz ilanları buraya ekleyebilirsiniz.</p>
              <Link href="/" className="btn btn-primary">
                İlanları Keşfet
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {favoriteItems.map(item => (
                <div
                  key={item.id}
                  className="card animate-slide-up"
                  style={{ display: 'flex', flexDirection: 'column', height: '100%', border: 'none', position: 'relative', overflow: 'hidden' }}
                >
                  {/* Favoriden Çıkar Butonu */}
                  <button
                    onClick={() => handleRemoveFavorite(item.id!, item.title)}
                    title="Favorilerden Çıkar"
                    style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10,
                      width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    ❤️
                  </button>

                  <Link href={`/listings/${item.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Görsel */}
                    <div style={{ height: '180px', background: '#F5E8E8', overflow: 'hidden', position: 'relative' }}>
                      {item.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                      )}
                      {item.isSold && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: '#EF4444', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '0.375rem', fontWeight: 800, fontSize: '0.8rem' }}>SATILDI</span>
                        </div>
                      )}
                    </div>

                    {/* Detay */}
                    <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
                      <span className="badge badge-red" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                        {item.category || 'İkinci El'}
                      </span>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0, lineHeight: 1.3 }}>
                        {item.title}
                      </h3>
                      <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: item.isSold ? '#9CA3AF' : '#8B1A1A', textDecoration: item.isSold ? 'line-through' : 'none' }}>
                          {item.price !== undefined ? `${item.price.toLocaleString('tr-TR')} ₺` : 'Fiyatsız'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#8B1A1A', fontWeight: 700 }}>İncele →</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
