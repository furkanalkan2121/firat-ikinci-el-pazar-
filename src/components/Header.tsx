import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { signOutUser, isAdminUser } from '../lib/auth';
import { useEffect, useState } from 'react';
import { getTotalUnread } from '../lib/localMessages';
import { getFavorites } from '../lib/localFavorites';
import { getAvatar } from '../lib/localProfile';

import {
  getUserNotifications,
  markAllNotificationsAsRead,
  type AppNotification,
} from '../lib/localNotifications';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Sayfa yüklendiğinde varsayılan temayı temizle (Dark mode tamamen kaldırıldı)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fu_theme');
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  // Bildirim ve sayacı yükle
  const updateCounts = async () => {
    if (!user) { setUnread(0); setFavCount(0); setUnreadNotifCount(0); setNotifications([]); setAvatarUrl(null); return; }
    setAvatarUrl(getAvatar(user.uid));
    const [totalUnread, favs, notifs] = await Promise.all([
      getTotalUnread(user.uid),
      getFavorites(user.uid),
      getUserNotifications(user.uid),
    ]);
    setUnread(totalUnread);
    setFavCount(favs.length);
    setNotifications(notifs);
    setUnreadNotifCount(notifs.filter(n => !n.read).length);
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener('fu_favorites_updated', updateCounts);
    window.addEventListener('fu_notifications_updated', updateCounts);
    window.addEventListener('fu_messages_updated', updateCounts);
    window.addEventListener('fu_avatar_updated', updateCounts);
    return () => {
      window.removeEventListener('fu_favorites_updated', updateCounts);
      window.removeEventListener('fu_notifications_updated', updateCounts);
      window.removeEventListener('fu_messages_updated', updateCounts);
      window.removeEventListener('fu_avatar_updated', updateCounts);
    };
  }, [user, router.pathname]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    setMobileNavOpen(false);
    await signOutUser(); // AuthContext onAuthStateChanged ile güncellenir
    router.push('/');
  };

  const isActive = (path: string) =>
    router.pathname === path || router.pathname.startsWith(path + '/');

  const navLinkStyle = (path: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '0.5rem',
    color: isActive(path) ? '#C9A227' : 'rgba(255,255,255,0.85)',
    fontWeight: isActive(path) ? 700 : 500,
    fontSize: '0.85rem',
    textDecoration: 'none',
    background: isActive(path) ? 'rgba(201,162,39,0.12)' : 'transparent',
    transition: 'all 0.2s',
  });

  return (
    <header style={{
      background: 'linear-gradient(135deg,#6B1010 0%,#8B1A1A 55%,#9B2020 100%)',
      boxShadow: '0 2px 16px rgba(107,16,16,0.45)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', padding: '0 1.25rem' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div className="fu-mark">FÜ</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              Fırat İkinci El
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Fırat Üniversitesi
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* Kampüs Tanışma */}
          <Link href="/tanisma" style={navLinkStyle('/tanisma')}>
            <span>🤝</span> Tanışma
          </Link>

          {/* Günlük Yemekhane */}
          <Link href="/yemekhane" style={navLinkStyle('/yemekhane')}>
            <span>🍜</span> Yemekhane
          </Link>

          {/* Ders Notları */}
          <Link href="/notlar" style={navLinkStyle('/notlar')}>
            <span>📚</span> Not Havuzu
          </Link>

          {/* Öğrenci Toplulukları */}
          <Link href="/topluluklar" style={navLinkStyle('/topluluklar')}>
            <span>👑</span> Topluluklar
          </Link>

          {user ? (
            <>
              {/* İlanlarım */}
              <Link href="/listings/my" style={navLinkStyle('/listings/my')}>
                İlanlarım
              </Link>

              {/* Favorilerim */}
              <Link href="/favorilerim" style={{ ...navLinkStyle('/favorilerim'), position: 'relative' }}>
                <span>❤️</span>
                Favorilerim
                {favCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#C9A227', color: '#6B1010',
                    borderRadius: '999px', minWidth: 18, height: 18,
                    fontSize: '0.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', border: '1.5px solid #8B1A1A',
                  }}>
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
              </Link>

              {/* Mesajlarım */}
              <Link href="/mesajlar" style={{ ...navLinkStyle('/mesajlar'), position: 'relative' }}>
                Mesajlar
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#EF4444', color: '#fff',
                    borderRadius: '999px', minWidth: 18, height: 18,
                    fontSize: '0.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', border: '1.5px solid #8B1A1A',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* Bildirimler (Zil 🔔) */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next && user) {
                      markAllNotificationsAsRead(user.uid);
                      setUnreadNotifCount(0);
                    }
                  }}
                  title="Bildirimler"
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                    width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                    position: 'relative', boxShadow: 'none',
                  }}
                >
                  🔔
                  {unreadNotifCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -3, right: -3,
                      background: '#EF4444', color: '#fff',
                      borderRadius: '999px', minWidth: 18, height: 18,
                      fontSize: '0.65rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', border: '1.5px solid #8B1A1A',
                    }}>
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Açılır Bildirim Çekmecesi */}
                {notifOpen && (
                  <>
                    <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                      background: '#fff', borderRadius: '0.875rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      width: 320, overflow: 'hidden', zIndex: 50, border: '1px solid #F3F4F6',
                    }}>
                      <div style={{ padding: '0.75rem 1rem', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', fontWeight: 800, fontSize: '0.85rem', color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🔔 Bildirimler Geçmişi</span>
                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{notifications.length} Bildirim</span>
                      </div>

                      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>
                            Henüz bir bildiriminiz yok.
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setNotifOpen(false);
                                if (n.listingId) router.push(`/listings/${n.listingId}`);
                              }}
                              style={{
                                padding: '0.75rem 1rem', borderBottom: '1px solid #F3F4F6',
                                background: n.read ? '#fff' : '#FFFDF9', cursor: n.listingId ? 'pointer' : 'default',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                              onMouseLeave={e => (e.currentTarget.style.background = n.read ? '#fff' : '#FFFDF9')}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>{n.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '0.15rem', lineHeight: 1.3 }}>{n.message}</div>
                              <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                                {new Date(n.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profil Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.625rem',
                    color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#C9A227',
                    color: '#6B1010', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : user.email[0].toUpperCase()}
                  </div>
                </button>

                {menuOpen && (
                  <>
                    <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                      background: '#fff', borderRadius: '0.875rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      minWidth: 190, overflow: 'hidden', zIndex: 50, border: '1px solid #F3F4F6',
                    }}>
                      {[
                        { href: '/profil',       icon: '👤', label: 'Profilim' },
                        ...(isAdminUser(user) ? [{ href: '/admin', icon: '🛡️', label: 'Admin Paneli' }] : []),
                        { href: '/favorilerim',  icon: '❤️', label: 'Favorilerim' },
                        { href: '/listings/my',  icon: '📋', label: 'İlanlarım' },
                        { href: '/listings/create', icon: '➕', label: 'İlan Ver' },
                        { href: '/mesajlar',     icon: '💬', label: 'Mesajlarım' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', color: '#374151', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                          <span>{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', padding: '0.625rem 1rem', border: 'none', background: 'none', color: '#EF4444', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', borderTop: '1px solid #F3F4F6' }}>
                        🚪 Çıkış Yap
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* İlan Ver Butonu */}
              <Link href="/listings/create" className="btn btn-gold btn-sm">
                + İlan Ver
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin" style={navLinkStyle('/auth/signin')}>Giriş Yap</Link>
              <Link href="/auth/signup" className="btn btn-gold btn-sm">Kayıt Ol</Link>
            </>
          )}
        </nav>

        {/* Mobil Hamburger Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setMobileNavOpen(o => !o)}
            className="mobile-menu-btn"
            style={{
              background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem',
              cursor: 'pointer', padding: '0.25rem', boxShadow: 'none',
            }}
          >
            {mobileNavOpen ? '✕' : '☰'}
          </button>
        </div>

      </div>

      {/* Mobil Menü Çekmecesi */}
      {mobileNavOpen && (
        <div style={{ background: '#6B1010', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/tanisma" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>🤝 Kampüs Tanışma</Link>
            <Link href="/yemekhane" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>🍜 Yemekhane Menüsü</Link>
            <Link href="/notlar" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>📚 Ders Notları &amp; Çıkmış Sorular</Link>
            <Link href="/topluluklar" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>👑 Öğrenci Toplulukları</Link>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '0.25rem 0' }} />

            {user ? (
              <>
                <Link href="/listings/create" onClick={() => setMobileNavOpen(false)} className="btn btn-gold" style={{ justifyContent: 'center' }}>
                  + İlan Ver
                </Link>
                <Link href="/profil" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>👤 Profilim ({user.email.split('@')[0]})</Link>
                <Link href="/favorilerim" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>❤️ Favorilerim ({favCount})</Link>
                <Link href="/listings/my" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>📋 İlanlarım</Link>
                <Link href="/mesajlar" onClick={() => setMobileNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>💬 Mesajlar ({unread})</Link>
                <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#EF4444', textAlign: 'left', fontWeight: 700, cursor: 'pointer', padding: 0 }}>🚪 Çıkış Yap</button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" onClick={() => setMobileNavOpen(false)} className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff', justifyContent: 'center' }}>Giriş Yap</Link>
                <Link href="/auth/signup" onClick={() => setMobileNavOpen(false)} className="btn btn-gold" style={{ justifyContent: 'center' }}>Kayıt Ol</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobil CSS Stilleri */}
      <style jsx>{`
        @media (max-width: 768px) {
          :global(.desktop-nav) { display: none !important; }
          :global(.mobile-menu-btn) { display: block !important; }
          :global(.mobile-dark-btn) { display: flex !important; }
        }
        @media (min-width: 769px) {
          :global(.mobile-menu-btn) { display: none !important; }
          :global(.mobile-dark-btn) { display: none !important; }
        }
      `}</style>
    </header>
  );
}
