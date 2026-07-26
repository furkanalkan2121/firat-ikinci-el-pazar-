import { useEffect, useState } from 'react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('fu_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fu_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '1.25rem',
        right: '1.25rem',
        maxWidth: '540px',
        margin: '0 auto',
        zIndex: 9999,
        background: '#fff',
        color: '#111827',
        padding: '1rem 1.25rem',
        borderRadius: '0.875rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>🍪</span> KVKK ve Çerez Kullanımı
        </div>
        <p style={{ fontSize: '0.78rem', color: '#4B5563', margin: 0, lineHeight: 1.4 }}>
          Fırat İkinci El platformunda deneyiminizi geliştirmek ve tercihlerinizi hatırlamak için yerel çerezler kullanılmaktadır.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleAccept}
          className="btn btn-primary btn-sm"
          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
        >
          Kabul Et &amp; Kapat
        </button>
      </div>
    </div>
  );
}
