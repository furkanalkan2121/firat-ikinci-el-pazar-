import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { signOutUser, changeUserPassword, deleteCurrentUser, isAdminUser } from '../lib/auth';
import { getUserListings, deleteListing, deleteUserAndListings, getUserMonthlyListingCount, type Listing } from '../lib/localStore';
import { getUserConversations, deleteUserMessages } from '../lib/localMessages';
import { clearUserFavorites } from '../lib/localFavorites';
import { deleteUserReviews } from '../lib/localReviews';
import { deleteUserReports } from '../lib/localReports';
import { deleteUserSocial } from '../lib/localSocial';
import { deleteUserNotifications } from '../lib/localNotifications';
import { getAvatar, setAvatar, removeAvatar, compressAvatar } from '../lib/localProfile';
import { useToast } from '../context/ToastContext';
import { getSellerReviews, getSellerAverageRating, type Review } from '../lib/localReviews';

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
  const { showToast } = useToast();
  const router = useRouter();

  const [listings,      setListings]      = useState<Listing[]>([]);
  const [convCount,     setConvCount]     = useState(0);
  const [reviews,       setReviews]       = useState<Review[]>([]);
  const [rating,        setRating]        = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [monthlyCount,  setMonthlyCount]  = useState(0);
  const [pageReady,     setPageReady]     = useState(false);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Şifre Değiştirme Formu Durumu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword,   setCurrentPassword]   = useState('');
  const [newPassword,       setNewPassword]       = useState('');
  const [confirmPassword,   setConfirmPassword]   = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signin'); return; }
    getUserListings(user.uid).then(ls => setListings(ls));
    getUserMonthlyListingCount(user.uid).then(setMonthlyCount);
    getUserConversations(user.uid).then(cs => setConvCount(cs.length));
    getSellerReviews(user.uid).then(setReviews);
    getSellerAverageRating(user.uid).then(setRating);
    setAvatarUrl(getAvatar(user.uid));
    setPageReady(true);
  }, [user, loading, router]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // aynı dosya tekrar seçilebilsin
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      showToast('Lütfen bir görsel dosyası seçin.', 'error');
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUrl = await compressAvatar(file);
      setAvatar(user.uid, dataUrl);
      setAvatarUrl(dataUrl);
      showToast('Profil fotoğrafınız güncellendi! 📸', 'success');
    } catch (err: any) {
      showToast(err.message || 'Fotoğraf yüklenemedi.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (!user) return;
    removeAvatar(user.uid);
    setAvatarUrl(null);
    showToast('Profil fotoğrafı kaldırıldı.', 'info');
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" silinsin mi?`)) return;
    setDeletingId(id);
    await deleteListing(id);
    setListings(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
    showToast('İlan silindi.', 'info');
  };

  const handleSignOut = async () => {
    await signOutUser();
    showToast('Çıkış yapıldı.', 'info');
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm1 = window.confirm('HESABINIZI SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\nTüm ilanlarınız ve profil verileriniz kalıcı olarak silinecektir.');
    if (!confirm1) return;

    // Firebase hesap silme için güvenlik gereği şifre ile yeniden doğrulama gerekir
    const pwd = window.prompt('Güvenlik için lütfen şifrenizi girin:');
    if (!pwd) { showToast('Hesap silme işlemi iptal edildi.', 'info'); return; }

    try {
      // Önce Firestore ilanlarını (oturum açıkken) sil
      await deleteUserAndListings(user.uid);
      // Firestore'daki diğer kullanıcı verilerini temizle
      await Promise.all([
        clearUserFavorites(user.uid),
        deleteUserMessages(user.uid),
        deleteUserReviews(user.uid),
        deleteUserNotifications(user.uid),
        deleteUserSocial(user.uid),
      ]);
      // Hâlâ yerel olan modüller (sonraki fazda taşınacak)
      deleteUserReports(user.uid);
      removeAvatar(user.uid);
      // Son olarak Firebase Auth hesabını sil (şifre ile yeniden doğrulama)
      await deleteCurrentUser(pwd);
      showToast('Hesabınız ve tüm verileriniz başarıyla silindi.', 'info');
      router.push('/');
    } catch (err: any) {
      showToast(err.message || 'Hesap silinemedi.', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      showToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Şifreler eşleşmiyor.', 'error');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Şifreniz başarıyla güncellendi! 🔑', 'success');
    } catch (err: any) {
      showToast(err.message || 'Şifre güncellenemedi.', 'error');
    } finally {
      setPasswordSubmitting(false);
    }
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

  const joinDate = (() => {
    if (!user) return '';
    if (user.uid === 'demo-user') return '1 Eylül 2024';
    const ts = parseInt(user.uid.replace('user-', ''));
    if (!isNaN(ts)) return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    return 'Bilinmiyor';
  })();

  const initials = user!.email[0].toUpperCase();
  const username = user!.email.split('@')[0];
  const isAdmin = isAdminUser(user);

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* ── Profil kartı ── */}
          <div className="card animate-slide-up" style={{ padding: 0, overflow: 'hidden', border: 'none', marginBottom: '1.5rem' }}>
            <div style={{ height: 110, background: 'linear-gradient(135deg,#6B1010 0%,#8B1A1A 50%,#9B2020 70%,#C9A227 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div style={{ padding: '0 1.75rem 1.75rem' }}>
              {/* Avatar — kapak üzerinde taşar, isim/butonlar aşağıda beyaz alanda kalır */}
              <div style={{ marginTop: -46, marginBottom: '0.875rem' }}>
                <div style={{ position: 'relative', width: 92, height: 92 }}>
                  <div style={{
                    width: 92, height: 92, borderRadius: '50%',
                    background: avatarUrl ? '#fff' : 'linear-gradient(135deg,#8B1A1A,#C9A227)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: '2rem',
                    border: '4px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Profil fotoğrafı" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : initials}
                  </div>

                  {/* Fotoğraf yükleme butonu (kamera) */}
                  <label
                    htmlFor="avatar-input"
                    title="Profil fotoğrafı yükle"
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 30, height: 30, borderRadius: '50%',
                      background: '#8B1A1A', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: uploadingAvatar ? 'wait' : 'pointer', fontSize: '0.8rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                  >
                    {uploadingAvatar ? '…' : '📷'}
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    disabled={uploadingAvatar}
                    style={{ display: 'none' }}
                  />
                </div>

                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', boxShadow: 'none' }}
                  >
                    Fotoğrafı kaldır
                  </button>
                )}
              </div>

              {/* İsim + Aksiyon Butonları (beyaz alan) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.01em', margin: 0 }}>
                      {username}
                    </h1>
                    {isAdmin && (
                      <Link href="/admin" className="badge badge-red" style={{ textDecoration: 'none', fontSize: '0.7rem' }}>
                        🛡️ Admin
                      </Link>
                    )}
                  </div>
                  <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: '0.15rem 0 0' }}>{user!.email}</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn btn-outline btn-sm"
                    style={{ background: '#fff' }}
                  >
                    🔑 Şifre Değiştir
                  </button>
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
                    Çıkış Yap
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Üyelik: {joinDate}
                </span>
                <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.625rem', borderRadius: '999px', border: '1px solid #FDE68A' }}>
                  ✓ Aktif Üye
                </span>
                <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.625rem', borderRadius: '999px' }}>
                  📊 Aylık Limit: {monthlyCount} / 10 İlan
                </span>
                {rating.count > 0 && (
                  <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.625rem', borderRadius: '999px' }}>
                    ⭐ Satıcı Puanı: {rating.average} ({rating.count} Yorum)
                  </span>
                )}
              </div>

              {/* 🏆 Öğrenci Başarım Rozetleri */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🏆</span> Kampüs Başarım Rozetleriniz
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(user?.email.includes('@firat.edu.tr') || user?.email.includes('@ogr.firat.edu.tr') || user?.uid === 'demo-user') && (
                    <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: '1px solid #FDE68A', fontWeight: 700 }}>
                      🎓 Onaylı FÜ Öğrencisi
                    </span>
                  )}
                  {listings.length >= 1 && (
                    <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: '1px solid #BAE6FD', fontWeight: 700 }}>
                      📦 Kampüs İlan Sahibi
                    </span>
                  )}
                  {listings.filter(l => l.category === 'Kitap & Kırtasiye').length >= 1 && (
                    <span className="badge" style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                      📚 Kitap Dostu
                    </span>
                  )}
                  {rating.average >= 4.5 && rating.count > 0 && (
                    <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: '1px solid #FCA5A5', fontWeight: 700 }}>
                      ⭐ Güvenilir Satıcı (5 Yıldız)
                    </span>
                  )}
                  <span className="badge" style={{ background: '#F3F4F6', color: '#4B5563', fontSize: '0.75rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}>
                    🤝 Aktif Topluluk Üyesi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── İstatistik kartları ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { emoji: '📦', count: listings.length,  label: 'Aktif İlan',   href: '/listings/my'  },
              { emoji: '💬', count: convCount,         label: 'Konuşma',      href: '/mesajlar'     },
              { emoji: '⭐', count: rating.average || '—', label: 'Satıcı Puanı', href: null       },
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

          {/* ── Aldığım Değerlendirmeler ── */}
          <div className="card" style={{ padding: '1.5rem', border: 'none', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', marginBottom: '1rem' }}>
              Aldığım Değerlendirmeler ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
                Henüz değerlendirme almadınız.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviews.map(rev => (
                  <div key={rev.id} style={{ padding: '0.75rem 1rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>
                        {rev.reviewerEmail.split('@')[0]}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#F59E0B' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#4B5563', margin: 0 }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Veri Dışa Aktarma (JSON / CSV) ── */}
          <div className="card" style={{ padding: '1.5rem', border: 'none', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>📥 Veri Dışa Aktarma</h3>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem', margin: 0 }}>
                  Yayınladığınız tüm ilanları bilgisayarınıza JSON veya CSV formatında indirin.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    if (listings.length === 0) { showToast('İndirilecek ilan bulunamadı.', 'info'); return; }
                    const jsonStr = JSON.stringify(listings, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `firat_ilanlarim_${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('İlanlar JSON formatında indirildi! 📥', 'success');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ background: '#fff' }}
                >
                  📄 JSON İndir
                </button>
                <button
                  onClick={() => {
                    if (listings.length === 0) { showToast('İndirilecek ilan bulunamadı.', 'info'); return; }
                    const headers = ['id', 'title', 'price', 'category', 'isSold', 'createdAt'];
                    const rows = listings.map(l => [
                      l.id || '',
                      `"${(l.title || '').replace(/"/g, '""')}"`,
                      l.price !== undefined ? l.price : '',
                      `"${l.category || ''}"`,
                      l.isSold ? 'Evet' : 'Hayır',
                      l.createdAt || '',
                    ]);
                    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `firat_ilanlarim_${Date.now()}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('İlanlar CSV formatında indirildi! 📊', 'success');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ background: '#fff' }}
                >
                  📊 CSV İndir
                </button>
              </div>
            </div>
          </div>

          {/* ── Tehlikeli Bölge (Hesap Silme) ── */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #FECACA', background: '#FEF2F2', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>Hesabımı Sil</h3>
                <p style={{ fontSize: '0.8rem', color: '#B91C1C', marginTop: '0.2rem', margin: 0 }}>
                  Hesabınızı ve yayınladığınız tüm ilanları kalıcı olarak siler.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="btn btn-sm"
                style={{ background: '#DC2626', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                ⚠️ Hesabımı Kalıcı Olarak Sil
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Şifre Değiştirme Modalı ── */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="card animate-slide-up"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', border: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: 0 }}>🔑 Şifre Değiştir</h2>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'none' }}>✕</button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Mevcut Şifre</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Yeni Şifre (En az 6 karakter)</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-outline btn-sm">İptal</button>
                <button type="submit" disabled={passwordSubmitting} className="btn btn-primary btn-sm">
                  {passwordSubmitting ? 'Kaydediliyor…' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
