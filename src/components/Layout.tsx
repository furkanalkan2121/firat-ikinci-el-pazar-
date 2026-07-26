import { ReactNode, useEffect, useState } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import CookieBanner from './CookieBanner';
import { useAuth } from '../context/AuthContext';
import { getTotalUnread } from '../lib/localMessages';

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const checkUnread = () => {
      const count = getTotalUnread(user.uid);
      setUnreadCount(count);
    };

    checkUnread();

    const interval = setInterval(checkUnread, 3000);
    window.addEventListener('storage', checkUnread);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkUnread);
    };
  }, [user]);

  // Sekme Başlığı (Title)
  const pageTitle = unreadCount > 0
    ? `🔴 (${unreadCount}) Fırat İkinci El | Fırat Üniversitesi`
    : `Fırat İkinci El | Fırat Üniversitesi Öğrenci Platformu`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Fırat Üniversitesi öğrencileri ve personeli için güvenli ikinci el eşya, ders kitabı, elektronik alım satım ve takas platformu." />
        <meta name="theme-color" content="#8B1A1A" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* PWA Manifest & Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/* OpenGraph & Social Media SEO Meta */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content="Fırat Üniversitesi kampüs içi güvenli ikinci el alım satım ve ders kitabı değiş-tokuş platformu." />
        <meta property="og:site_name" content="Fırat İkinci El" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content="Fırat Üniversitesi öğrencilerine özel ikinci el eşya platformu." />
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
        <CookieBanner />
      </div>
    </>
  );
}
