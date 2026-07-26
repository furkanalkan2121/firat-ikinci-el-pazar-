import { ReactNode, useEffect, useState } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
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

    // Periyodik kontrol ve storage dinleyicisi
    const interval = setInterval(checkUnread, 3000);
    window.addEventListener('storage', checkUnread);

    // Tarayıcı Bildirim İzni (Notification API)
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
        <meta name="description" content="Fırat Üniversitesi öğrencileri için ikinci el eşya, ders kitabı ve elektronik alım satım platformu." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </div>
    </>
  );
}
