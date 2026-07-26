import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getListing, deleteListing, toggleListingSold, type Listing } from '../../lib/localStore';
import { useAuth } from '../../context/AuthContext';
import { sendMessage, makeConvId, getUserConversations } from '../../lib/localMessages';
import { isFavorite, toggleFavorite } from '../../lib/localFavorites';
import { useToast } from '../../context/ToastContext';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m} dakika önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function ListingDetail() {
  const router   = useRouter();
  const { id }   = router.query as { id: string };
  const { user } = useAuth();
  const { showToast } = useToast();

  const [listing,          setListing]          = useState<Listing | null>(null);
  const [pageLoading,      setPageLoading]      = useState(true);
  const [imgIndex,         setImgIndex]         = useState(0);
  const [msgText,          setMsgText]          = useState('');
  const [msgSent,          setMsgSent]          = useState(false);
  const [sendingMsg,       setSendingMsg]       = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [hasExistingConv,  setHasExistingConv]  = useState(false);
  const [fav,              setFav]              = useState(false);

  // Lightbox Galeri Durumu
  const [lightboxOpen,     setLightboxOpen]     = useState(false);

  useEffect(() => {
    if (!id) return;
    getListing(id).then(l => { setListing(l); setPageLoading(false); });
  }, [id]);

  useEffect(() => {
    if (user && listing && listing.id) {
      setFav(isFavorite(user.uid, listing.id));
    }
  }, [user, listing]);

  useEffect(() => {
    if (!user || !listing || listing.ownerId === user.uid) return;
    const convId = makeConvId(listing.id!, user.uid, listing.ownerId!);
    import('../../lib/localMessages').then(({ getConversationMessages }) => {
      const msgs = getConversationMessages(convId);
      setHasExistingConv(msgs.length > 0);
    });
  }, [user, listing]);

  const isOwner = user && listing && user.uid === listing.ownerId;

  const handleFavToggle = () => {
    if (!user) {
      showToast('Favorilere eklemek için lütfen giriş yapın.', 'info');
      return;
    }
    if (!listing?.id) return;
    const isNowFav = toggleFavorite(user.uid, listing.id);
    setFav(isNowFav);
    showToast(isNowFav ? 'Favorilere eklendi! ❤️' : 'Favorilerden çıkarıldı.', isNowFav ? 'success' : 'info');
  };

  const handleDelete = async () => {
    if (!listing?.id || !window.confirm('İlanı silmek istediğinize emin misiniz?')) return;
    setDeleting(true);
    await deleteListing(listing.id);
    showToast('İlan başarıyla silindi.', 'info');
    router.push('/listings/my');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !user || !listing || !listing.ownerId) return;

    setSendingMsg(true);

    try {
      sendMessage({
        listingId: listing.id!,
        listingTitle: listing.title,
        senderId: user.uid,
        senderEmail: user.email,
        receiverId: listing.ownerId,
        receiverEmail: listing.ownerId.startsWith('demo') ? 'demo@firat.edu.tr' : listing.ownerId,
        text: msgText.trim(),
      });

      setMsgSent(true);
      setMsgText('');
      showToast('Mesajınız başarıyla satıcıya iletildi! 💬', 'success');
      setTimeout(() => {
        const convId = makeConvId(listing.id!, user.uid, listing.ownerId!);
        router.push(`/mesajlar/${convId}`);
      }, 1000);
    } catch {
      showToast('Mesaj gönderilirken hata oluştu.', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="fu-mark" style={{ width: 48, height: 48 }}>FÜ</div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>İlan Bulunamadı</h1>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Aradığınız ilan silinmiş veya mevcut değil.</p>
          <Link href="/" className="btn btn-primary">Tüm İlanlara Dön</Link>
        </div>
      </Layout>
    );
  }

  const convId = user && listing && listing.ownerId
    ? makeConvId(listing.id!, user.uid, listing.ownerId)
    : '';

  const images = listing.images && listing.images.length > 0 ? listing.images : [];

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)', padding: '2rem 1.25rem 4rem', minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Geri */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280', fontSize: '0.83rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tüm İlanlar
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

            {/* ── Üst: Görsel + Başlık (yan yana) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem' }}>

              {/* Görsel galerisi */}
              <div className="card animate-fade-in" style={{ border: 'none', overflow: 'hidden', position: 'relative' }}>
                {images.length > 0 ? (
                  <>
                    <div
                      onClick={() => setLightboxOpen(true)}
                      title="Büyütmek için tıklayın"
                      style={{ height: '320px', overflow: 'hidden', position: 'relative', background: '#F5F0EB', cursor: 'zoom-in' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[imgIndex]}
                        alt={listing.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Büyüteç İkonu İpucu */}
                      <div style={{
                        position: 'absolute', bottom: '0.75rem', right: '0.75rem',
                        background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '0.3rem 0.65rem',
                        borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <span>🔍 Büyüt</span>
                      </div>
                    </div>
                    {images.length > 1 && (
                      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', overflowX: 'auto' }}>
                        {images.map((src, i) => (
                          <button key={i} onClick={() => setImgIndex(i)}
                            style={{ width: 60, height: 60, borderRadius: '0.375rem', overflow: 'hidden', border: `2px solid ${i === imgIndex ? '#8B1A1A' : '#E5E7EB'}`, padding: 0, cursor: 'pointer', flexShrink: 0, background: 'none', boxShadow: 'none' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ height: '320px', background: 'linear-gradient(135deg, #F5E8E8 0%, #F0D8D8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Fotoğraf eklenmemiş</span>
                  </div>
                )}
              </div>

              {/* Bilgi kartı */}
              <div className="card animate-slide-up" style={{ padding: '1.5rem', border: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                
                {/* Favori Butonu */}
                <button
                  onClick={handleFavToggle}
                  title={fav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    width: 40, height: 40, borderRadius: '50%', background: '#F9FAFB',
                    border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {fav ? '❤️' : '🤍'}
                </button>

                {/* Kategori + Satıldı Rozeti + tarih */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingRight: '2.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    {listing.category && <span className="badge badge-red">{listing.category}</span>}
                    {listing.isSold && (
                      <span className="badge" style={{ background: '#EF4444', color: '#fff' }}>🏷️ SATILDI</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{listing.createdAt ? timeAgo(listing.createdAt) : ''}</span>
                </div>

                {/* Başlık */}
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
                  {listing.title}
                </h1>

                {/* Fiyat */}
                {listing.price !== undefined ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: listing.isSold ? '#9CA3AF' : '#8B1A1A', letterSpacing: '-0.02em', textDecoration: listing.isSold ? 'line-through' : 'none' }}>
                      {listing.price.toLocaleString('tr-TR')}
                    </span>
                    <span style={{ fontWeight: 700, color: listing.isSold ? '#9CA3AF' : '#8B1A1A', fontSize: '1.1rem' }}>₺</span>
                  </div>
                ) : (
                  <span className="badge badge-gray" style={{ fontSize: '0.85rem' }}>Fiyat belirtilmemiş</span>
                )}

                {/* Satıcı */}
                <div style={{ padding: '0.875rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px solid #F3F4F6' }}>
                  <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>Satıcı</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                      {(listing.ownerId ?? '?')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                      {isOwner ? 'Siz' : (listing.ownerId?.startsWith('demo') ? 'demo@firat.edu.tr' : listing.ownerId)}
                    </span>
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: 'auto' }}>
                  {isOwner ? (
                    <>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/listings/edit/${listing.id}`} className="btn btn-gold btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                          ✏️ Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            const newStatus = await toggleListingSold(listing.id!);
                            setListing(prev => prev ? { ...prev, isSold: newStatus } : null);
                            showToast(newStatus ? 'İlan Satıldı olarak güncellendi.' : 'İlan tekrar aktif edildi.', 'success');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          {listing.isSold ? '🔄 Aktif Et' : '🏷️ Satıldı Yap'}
                        </button>
                      </div>
                      <button onClick={handleDelete} disabled={deleting}
                        style={{ padding: '0.625rem 1.25rem', borderRadius: '0.375rem', border: '2px solid #EF4444', background: deleting ? '#FEE2E2' : 'transparent', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: 'none' }}>
                        {deleting ? 'Siliniyor…' : '🗑 İlanı Sil'}
                      </button>
                    </>
                  ) : (
                    listing.isSold ? (
                      <div className="alert alert-error" style={{ textAlign: 'center', margin: 0 }}>
                        Bu ürün satılmıştır, yeni mesaj gönderilemez.
                      </div>
                    ) : (
                      user ? (
                        hasExistingConv ? (
                          <Link
                            href={`/mesajlar/${convId}`}
                            className="btn btn-primary btn-lg"
                            style={{ justifyContent: 'center' }}
                          >
                            💬 Konuşmaya Git
                          </Link>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: '#6B7280', background: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                            Aşağıdan ilk mesajınızı gönderin ↓
                          </div>
                        )
                      ) : (
                        <Link href="/auth/signin" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
                          Mesaj göndermek için giriş yap
                        </Link>
                      )
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Açıklama */}
            {listing.description && (
              <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>İlan Açıklaması</h2>
                <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.7, whitespace: 'pre-line' }}>
                  {listing.description}
                </p>
              </div>
            )}

            {/* Mesaj Gönderme Formu */}
            {!isOwner && !listing.isSold && user && !hasExistingConv && (
              <div className="card animate-slide-up" style={{ padding: '1.5rem', border: 'none' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>
                  Satıcıya Mesaj Gönder
                </h2>

                {msgSent ? (
                  <div className="alert alert-success">
                    ✓ Mesajınız iletildi! Konuşmaya yönlendiriliyorsunuz…
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage}>
                    <div className="form-group">
                      <textarea
                        className="form-input form-textarea"
                        placeholder="Merhaba, bu ürünle ilgileniyorum. Durumu nedir?"
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        rows={3}
                        required
                        maxLength={500}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingMsg || !msgText.trim()}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {sendingMsg ? 'Gönderiliyor…' : '✉️ Mesaj Gönder'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Lightbox Galeri Modal (Tam Ekran Görsel) ── */}
      {lightboxOpen && images.length > 0 && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Kapat butonu */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
              width: 44, height: 44, borderRadius: '50%', fontSize: '1.25rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'none', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            ✕
          </button>

          {/* Görsel Sayacı */}
          <div style={{
            position: 'absolute', top: '1.75rem', left: '1.5rem',
            color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600
          }}>
            {imgIndex + 1} / {images.length}
          </div>

          {/* Büyük Görsel */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imgIndex]}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            />
          </div>

          {/* Önceki / Sonraki Butonları */}
          {images.length > 1 && (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                  padding: '0.5rem 1.25rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                ← Önceki
              </button>
              <button
                onClick={() => setImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                  padding: '0.5rem 1.25rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
