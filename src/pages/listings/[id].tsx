import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getListing, deleteListing, type Listing } from '../../lib/localStore';
import { useAuth } from '../../context/AuthContext';
import { sendMessage, makeConvId, getUserConversations } from '../../lib/localMessages';

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

  const [listing,    setListing]    = useState<Listing | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [imgIndex,   setImgIndex]   = useState(0);
  const [msgText,    setMsgText]    = useState('');
  const [msgSent,    setMsgSent]    = useState(false);
  const [msgError,   setMsgError]   = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [hasExistingConv, setHasExistingConv] = useState(false);

  useEffect(() => {
    if (!id) return;
    getListing(id).then(l => { setListing(l); setPageLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!user || !listing || listing.ownerId === user.uid) return;
    getUserConversations(user.uid).then
      ? undefined
      : undefined;
    // check if conversation already exists
    const convId = makeConvId(listing.id!, user.uid, listing.ownerId!);
    import('../../lib/localMessages').then(({ getConversationMessages }) => {
      const msgs = getConversationMessages(convId);
      setHasExistingConv(msgs.length > 0);
    });
  }, [user, listing]);

  const isOwner = user && listing && user.uid === listing.ownerId;

  const handleDelete = async () => {
    if (!listing?.id || !window.confirm('İlanı silmek istediğinize emin misiniz?')) return;
    setDeleting(true);
    await deleteListing(listing.id);
    router.push('/listings/my');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !user || !listing) return;
    if (!listing.ownerId) { setMsgError('Bu ilanın sahibi bulunamadı.'); return; }
    setSendingMsg(true);
    setMsgError('');
    try {
      const { sendMessage: send } = await import('../../lib/localMessages');
      send({
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
      setHasExistingConv(true);
    } catch (err: any) {
      setMsgError(err.message || 'Mesaj gönderilemedi.');
    } finally {
      setSendingMsg(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="fu-mark" style={{ margin: '0 auto 1rem', width: 48, height: 48 }}>FÜ</div>
            <p style={{ color: '#6B7280' }}>İlan yükleniyor…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>İlan Bulunamadı</h1>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>Bu ilan mevcut değil ya da silinmiş olabilir.</p>
          <Link href="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
        </div>
      </Layout>
    );
  }

  const convId = listing.ownerId && user
    ? makeConvId(listing.id!, user.uid, listing.ownerId)
    : '';

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

            {/* ── Üst: Görsel + Başlık (masaüstünde yan yana) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem' }}>

              {/* Görsel galerisi */}
              <div className="card animate-fade-in" style={{ border: 'none', overflow: 'hidden' }}>
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <div style={{ height: '300px', overflow: 'hidden', position: 'relative', background: '#F5F0EB' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={listing.images[imgIndex]}
                        alt={listing.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {listing.images.length > 1 && (
                      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', overflowX: 'auto' }}>
                        {listing.images.map((src, i) => (
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
                  <div style={{ height: '300px', background: 'linear-gradient(135deg, #F5E8E8 0%, #F0D8D8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Fotoğraf eklenmemiş</span>
                  </div>
                )}
              </div>

              {/* Bilgi kartı */}
              <div className="card animate-slide-up" style={{ padding: '1.5rem', border: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Kategori + tarih */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {listing.category && <span className="badge badge-red">{listing.category}</span>}
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{listing.createdAt ? timeAgo(listing.createdAt) : ''}</span>
                </div>

                {/* Başlık */}
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
                  {listing.title}
                </h1>

                {/* Fiyat */}
                {listing.price !== undefined ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#8B1A1A', letterSpacing: '-0.02em' }}>
                      {listing.price.toLocaleString('tr-TR')}
                    </span>
                    <span style={{ fontWeight: 700, color: '#8B1A1A', fontSize: '1.1rem' }}>₺</span>
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
                      <Link href={`/listings/my`} className="btn btn-outline" style={{ justifyContent: 'center' }}>
                        İlanlarıma Git
                      </Link>
                      <button onClick={handleDelete} disabled={deleting}
                        style={{ padding: '0.625rem 1.25rem', borderRadius: '0.375rem', border: '2px solid #EF4444', background: deleting ? '#FEE2E2' : 'transparent', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: 'none' }}>
                        {deleting ? 'Siliniyor…' : '🗑 İlanı Sil'}
                      </button>
                    </>
                  ) : user ? (
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
                  )}
                </div>
              </div>
            </div>

            {/* ── Açıklama ── */}
            {listing.description && (
              <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', marginBottom: '0.75rem' }}>Açıklama</h2>
                <p style={{ color: '#4B5563', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              </div>
            )}

            {/* ── Mesaj gönder ── */}
            {user && !isOwner && !hasExistingConv && (
              <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💬 Satıcıya Mesaj Gönder
                </h2>
                {msgSent ? (
                  <div className="alert alert-success">
                    Mesajınız gönderildi!{' '}
                    <Link href={`/mesajlar/${convId}`} style={{ color: '#166534', fontWeight: 700 }}>
                      Konuşmayı Görüntüle →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage}>
                    <textarea
                      className="form-input form-textarea"
                      placeholder={`"${listing.title}" hakkında bir şey sorun…`}
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      required
                      maxLength={1000}
                      style={{ marginBottom: '0.75rem' }}
                    />
                    {msgError && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{msgError}</div>}
                    <button type="submit" disabled={sendingMsg || !msgText.trim()} className="btn btn-primary">
                      {sendingMsg ? 'Gönderiliyor…' : 'Mesaj Gönder'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
