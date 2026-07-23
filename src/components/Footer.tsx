export default function Footer() {
  return (
    <footer
      style={{
        background: 'linear-gradient(135deg, #1A0808 0%, #2D0E0E 100%)',
        color: 'rgba(255,255,255,0.65)',
        marginTop: 'auto',
        paddingTop: '2.5rem',
        paddingBottom: '1.5rem',
        fontSize: '0.85rem',
      }}
    >
      <div className="page-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div className="fu-mark" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                FÜ
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                Fırat İkinci El
              </span>
            </div>
            <p style={{ lineHeight: 1.7 }}>
              Fırat Üniversitesi öğrenci ve akademisyen topluluğunun güvenli ikinci el eşya paylaşım platformu.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: '#C9A227', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Hızlı Erişim
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {[
                { href: '/', label: 'İlanlar' },
                { href: '/listings/create', label: 'İlan Ver' },
                { href: '/auth/signin', label: 'Giriş Yap' },
                { href: '/auth/signup', label: 'Kayıt Ol' },
              ].map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    style={{
                      color: 'rgba(255,255,255,0.65)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#C9A227')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#C9A227', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              İletişim
            </h4>
            <p style={{ lineHeight: 1.8 }}>
              Fırat Üniversitesi<br />
              23119 Elazığ / Türkiye<br />
              <span style={{ color: '#C9A227' }}>firat.edu.tr</span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.10)',
            paddingTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>© {new Date().getFullYear()} Fırat Üniversitesi İkinci El Platformu</span>
          <span style={{ color: '#C9A227' }}>Fırat Üniversitesi · Elazığ</span>
        </div>
      </div>
    </footer>
  );
}
