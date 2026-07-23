import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { signOutLocal } from '../lib/localAuth';
import { getUserListings, deleteListing, type Listing } from '../lib/localStore';
import { getUserConversations } from '../lib/localMessages';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(p?: number) {
  if (p === undefined) return 'Fiyatsız';
  return `${p.toLocaleString('tr-TR')} ₺`;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [listings,   setListings]   = useState<Listing[]>([]);
  const [convCount,  setConvCount]  = useState(0);
  const [pageReady,  setPageReady]  = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signin'); return; }
    getUserListings(user.uid).then(ls => setListings(ls));
    setConvCount(getUserConversations(user.uid).length);
    setPageReady(true);
  }, [user, loading, router]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" silinsin mi?`)) return;
    setDeletingId(id);
    await deleteListing(id);
    setListings(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  const handleSignOut = () => {
    signOutLocal();
    window.dispatchEvent(new StorageEvent('storage', { key: 'fu_current_user' }));
    router.push('/');
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

  // Üyelik tarihi: uid'den al (user-{timestamp}) veya sabit
  const joinDate = (() => {
    if (!user) return '';
    if (user.uid === 'demo-user') return '1 Eylül 2024';
    const ts = parseInt(user.uid.replace('user-', ''));
    if (!isNaN(ts)) return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    return 'Bilinmiyor';
  })();

  const initials = user!.email[0].toUpperCase();
  const username = user!.email.split('@')[0];

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* ── Profil kartı ── */}
          <div className="card animate-slide-up" style={{ padding: 0, overflow: 'hidden', border: 'none', marginBottom: '1.5rem' }}>
            {/* Banner */}
            <div style={{ height: 110, background: 'linear-gradient(135deg,#6B1010 0%,#8B1A1A 50%,#9B2020 70%,#C9A227 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div style={{ padding: '0 1.75rem 1.75rem' }}>
              {/* Avatar + isim */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -42, marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                  <div style={{
                    width: 84, height: 84, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#8B1A1A,#C9A227)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: '2rem',
                    border: '4px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ paddingBottom: '0.25rem' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.01em', margin: 0 }}>
                      {username}
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: 0 }}>{user!.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.45rem 1rem', borderRadius: '0.5rem',
                    border: '1.5px solid #E5E7EB', background: '#fff',
                    color: '#6B7280', fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Çıkış Yap
                </button>
              </div>

              {/* Üyelik bilgisi + rozet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Üyelik: {joinDate}
                </span>
                <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.625rem', borderRadius: '999px', border: '1px solid #FDE68A' }}>
                  ✓ Aktif Üye
                </span>
                {user!.uid === 'demo-user' && (
                  <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.625rem', borderRadius: '999px', border: '1px solid #BFDBFE' }}>
                    Demo Hesabı
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── İstatistik kartları ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { emoji: '📦', count: listings.length,  label: 'Aktif İlan',   href: '/listings/my'  },
              { emoji: '💬', count: convCount,         label: 'Konuşma',      href: '/mesajlar'     },
              { emoji: '👁', count: listings.length * 12, label: 'Görüntülenme', href: null         },
            ].map(stat => (
              <div
                key={stat.label}
                onClick={() => stat.href && router.push(stat.href)}
                className="card"
                style={{
                  padding: '1.25rem', textAlign: 'center', border: 'none',
                  cursor: stat.href ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { if (stat.href) { e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>{stat.emoji}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8B1A1A', letterSpacing: '-0.02em' }}>{stat.count}</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Hızlı erişim ── */}
          <div className="card" style={{ padding: '1.25rem', border: 'none', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', marginBottom: '1rem' }}>Hızlı Erişim</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/listings/create" className="btn btn-primary">
                + Yeni İlan Ekle
              </Link>
              <Link href="/listings/my" className="btn btn-outline">
                📋 İlanlarım
              </Link>
              <Link href="/mesajlar" className="btn btn-outline" style={{ position: 'relative' }}>
                💬 Mesajlarım
              </Link>
              <Link href="/" className="btn btn-outline">
                🏠 Ana Sayfa
              </Link>
            </div>
          </div>

          {/* ── İlanlarım ── */}
          <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', margin: 0 }}>İlanlarım</h2>
              <Link href="/listings/my" style={{ fontSize: '0.8rem', color: '#8B1A1A', fontWeight: 600, textDecoration: 'none' }}>
                Tümünü Gör →
              </Link>
            </div>

            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Henüz ilan eklemediniz.</p>
                <Link href="/listings/create" className="btn btn-gold">
                  İlk İlanı Ekle
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {listings.slice(0, 5).map(listing => (
                  <div key={listing.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: '0.625rem', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F9FAFB')}
                  >
                    {/* Küçük görsel */}
                    <div style={{ width: 52, height: 52, borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, background: '#E5E7EB' }}>
                      {listing.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📦</div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#8B1A1A', fontWeight: 700 }}>
                        {formatPrice(listing.price)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      <Link href={`/listings/${listing.id}`}
                        style={{ padding: '0.3rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid #E5E7EB', color: '#374151', textDecoration: 'none', fontWeight: 500, background: '#fff' }}>
                        Gör
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id!, listing.title)}
                        disabled={deletingId === listing.id}
                        style={{ padding: '0.3rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid #FECACA', color: '#EF4444', fontWeight: 500, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'none' }}
                      >
                        {deletingId === listing.id ? '…' : 'Sil'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
