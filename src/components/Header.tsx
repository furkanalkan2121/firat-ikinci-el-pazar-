import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { signOutLocal } from '../lib/localAuth';
import { useEffect, useState } from 'react';
import { getTotalUnread } from '../lib/localMessages';
import { getFavorites } from '../lib/localFavorites';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [, forceUpdate] = useState(0);
  const [unread, setUnread] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Okunmamış mesaj ve favori sayısını yükle
  const updateCounts = () => {
    if (!user) { setUnread(0); setFavCount(0); return; }
    setUnread(getTotalUnread(user.uid));
    setFavCount(getFavorites(user.uid).length);
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener('fu_favorites_updated', updateCounts);
    return () => window.removeEventListener('fu_favorites_updated', updateCounts);
  }, [user, router.pathname]);

  const handleSignOut = () => {
    signOutLocal();
    setMenuOpen(false);
    forceUpdate(n => n + 1);
    window.dispatchEvent(new StorageEvent('storage', { key: 'fu_current_user' }));
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
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {user ? (
            <>
              {/* İlanlarım */}
              <Link href="/listings/my" style={navLinkStyle('/listings/my')}
                onMouseEnter={e => { if (!isActive('/listings/my')) e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { if (!isActive('/listings/my')) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                İlanlarım
              </Link>

              {/* Favorilerim */}
              <Link href="/favorilerim" style={{ ...navLinkStyle('/favorilerim'), position: 'relative' }}
                onMouseEnter={e => { if (!isActive('/favorilerim')) e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { if (!isActive('/favorilerim')) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}>
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
              <Link href="/mesajlar" style={{ ...navLinkStyle('/mesajlar'), position: 'relative' }}
                onMouseEnter={e => { if (!isActive('/mesajlar')) e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { if (!isActive('/mesajlar')) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
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

              {/* Profil dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.3rem 0.5rem 0.3rem 0.5rem',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '0.625rem', cursor: 'pointer', fontFamily: 'inherit',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 600, boxShadow: 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#C9A227', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#6B1010' }}>
                    {user.email[0].toUpperCase()}
                  </div>
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email.split('@')[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <>
                    <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                      background: '#fff', borderRadius: '0.875rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      minWidth: 200, overflow: 'hidden', zIndex: 50,
                      border: '1px solid #F3F4F6', animation: 'fadeIn 0.15s ease',
                    }}>
                      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', marginBottom: '0.125rem' }}>
                          {user.email.split('@')[0]}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{user.email}</div>
                      </div>
                      {[
                        { href: '/profil',       icon: '👤', label: 'Profilim' },
                        ...(user && (user.email.includes('admin') || user.email === 'demo@firat.edu.tr') ? [{ href: '/admin', icon: '🛡️', label: 'Admin Paneli' }] : []),
                        { href: '/favorilerim',  icon: '❤️', label: 'Favorilerim' },
                        { href: '/listings/my',  icon: '📋', label: 'İlanlarım' },
                        { href: '/listings/create', icon: '➕', label: 'İlan Ver' },
                        { href: '/mesajlar',     icon: '💬', label: 'Mesajlarım' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', color: '#374151', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <span>{item.icon}</span>
                          {item.label}
                          {item.href === '/mesajlar' && unread > 0 && (
                            <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', borderRadius: '999px', padding: '0 6px', fontSize: '0.68rem', fontWeight: 800 }}>
                              {unread}
                            </span>
                          )}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid #F3F4F6' }}>
                        <button onClick={handleSignOut}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit', boxShadow: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

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
      </div>

      {/* Gold accent line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg,transparent 0%,#C9A227 30%,#E8C547 60%,transparent 100%)' }} />
    </header>
  );
}
