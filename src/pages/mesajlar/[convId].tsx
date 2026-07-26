import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
  type Message,
} from '../../lib/localMessages';
import { FU_CAMPUS_LOCATIONS } from '../../lib/localStore';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Resim Sıkıştırma (Canvas API) */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas hatası');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject('Resim hatası'); };
    img.src = url;
  });
}

export default function ConversationPage() {
  const router  = useRouter();
  const rawId   = router.query.convId;
  const convId  = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');
  const { user, loading } = useAuth();

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [newText,   setNewText]   = useState('');
  const [sending,   setSending]   = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(FU_CAMPUS_LOCATIONS[1]);
  const [selectedTime, setSelectedTime] = useState('14:00');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMsgs = () => {
    if (!convId) return;
    setMessages(getConversationMessages(convId));
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signin'); return; }
    if (!convId) return;
    loadMsgs();
    markConversationRead(convId, user.uid);
    setPageReady(true);
  }, [convId, user, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getReceiverInfo = () => {
    const other = messages.find(m => m.senderId !== user?.uid) ??
                  messages.find(m => m.receiverId !== user?.uid);
    const receiverId    = other ? (other.senderId === user?.uid ? other.receiverId    : other.senderId)    : '';
    const receiverEmail = other ? (other.senderId === user?.uid ? other.receiverEmail : other.senderEmail) : '';
    return { receiverId, receiverEmail };
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !user || !convId || sending) return;

    const { receiverId, receiverEmail } = getReceiverInfo();
    if (!receiverId) return;

    setSending(true);
    sendMessage({
      conversationId: convId,
      listingId:     messages[0]?.listingId    ?? '',
      listingTitle:  messages[0]?.listingTitle ?? '',
      senderId:      user.uid,
      senderEmail:   user.email,
      receiverId,
      receiverEmail,
      text: newText.trim(),
    });
    setNewText('');
    loadMsgs();
    setSending(false);
    textareaRef.current?.focus();
  };

  // Fotoğraf Gönderme
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !convId) return;

    const { receiverId, receiverEmail } = getReceiverInfo();
    if (!receiverId) return;

    try {
      setSending(true);
      const dataUrl = await compressImage(file);
      sendMessage({
        conversationId: convId,
        listingId:     messages[0]?.listingId    ?? '',
        listingTitle:  messages[0]?.listingTitle ?? '',
        senderId:      user.uid,
        senderEmail:   user.email,
        receiverId,
        receiverEmail,
        text: '📷 [Fotoğraf Gönderildi]',
        imageDataUrl: dataUrl,
      });
      loadMsgs();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Buluşma Noktası Teklifi Gönderme
  const handleSendLocationOffer = () => {
    if (!user || !convId) return;
    const { receiverId, receiverEmail } = getReceiverInfo();
    if (!receiverId) return;

    sendMessage({
      conversationId: convId,
      listingId:     messages[0]?.listingId    ?? '',
      listingTitle:  messages[0]?.listingTitle ?? '',
      senderId:      user.uid,
      senderEmail:   user.email,
      receiverId,
      receiverEmail,
      text: `📍 Buluşma Teklifi: ${selectedLocation} (Saat: ${selectedTime})`,
      locationOffer: `${selectedLocation} (Saat: ${selectedTime})`,
    });

    setShowLocationModal(false);
    loadMsgs();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText(e);
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

  const other = messages.find(m => m.senderId !== user?.uid) ??
                messages.find(m => m.receiverId !== user?.uid);
  const otherEmail = other
    ? (other.senderId === user?.uid ? other.receiverEmail : other.senderEmail)
    : 'Kullanıcı';
  const listingTitle = messages[0]?.listingTitle ?? 'İlan';
  const listingId    = messages[0]?.listingId;

  return (
    <Layout>
      <div style={{ background: '#F9FAFB', minHeight: 'calc(100vh - 180px)', padding: '1.5rem 1.25rem 3rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Sohbet Kutusu Container */}
          <div className="card" style={{ border: 'none', borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: '520px' }}>

            {/* Üst Başlık (Header) */}
            <div style={{ padding: '0.875rem 1.25rem', background: 'linear-gradient(135deg,#6B1010,#8B1A1A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link href="/mesajlar" style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </Link>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C9A227', color: '#6B1010', fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {otherEmail[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>{otherEmail.split('@')[0]}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                    📦 {listingTitle}
                  </div>
                </div>
              </div>

              {listingId && (
                <Link href={`/listings/${listingId}`} className="btn btn-gold btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                  İlana Git →
                </Link>
              )}
            </div>

            {/* Mesaj Listesi */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem', background: '#FAFAF9' }}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user!.uid;
                const showDate =
                  i === 0 ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(messages[i - 1].createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {/* Tarih ayracı */}
                    {showDate && (
                      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', background: '#F3F4F6', padding: '0.2rem 0.75rem', borderRadius: '999px' }}>
                          {new Date(msg.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}

                    {/* Baloncuk */}
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem' }}>
                      {!isMe && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#8B1A1A,#C9A227)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.65rem', flexShrink: 0, marginBottom: 2 }}>
                          {msg.senderEmail[0]?.toUpperCase()}
                        </div>
                      )}
                      <div style={{ maxWidth: '75%' }}>
                        
                        {/* Konum Teklifi Kartı Mesajı */}
                        {msg.locationOffer ? (
                          <div style={{
                            padding: '0.875rem', borderRadius: '1rem',
                            background: isMe ? '#FFFDF9' : '#fff',
                            border: '1.5px solid #FDE68A', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>📍 Buluşma Noktası Teklifi</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '0.25rem' }}>
                              {msg.locationOffer}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '0.35rem' }}>
                              {isMe ? 'Buluşma teklifini gönderdiniz.' : 'Satıcı/Alıcı sizinle bu noktada buluşmak istiyor.'}
                            </div>
                          </div>
                        ) : msg.imageDataUrl ? (
                          /* Görsel Mesajı */
                          <div style={{ borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.imageDataUrl} alt="Sohbet fotoğrafı" style={{ maxWidth: '100%', maxHeight: '260px', display: 'block', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          /* Normal Metin Mesajı */
                          <div
                            style={{
                              padding: '0.625rem 0.875rem',
                              borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                              background: isMe
                                ? 'linear-gradient(135deg,#8B1A1A,#A82020)'
                                : '#F3F4F6',
                              color: isMe ? '#fff' : '#111827',
                              fontSize: '0.875rem',
                              lineHeight: 1.55,
                              wordBreak: 'break-word',
                              boxShadow: isMe ? '0 2px 8px rgba(139,26,26,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                          >
                            {msg.text}
                          </div>
                        )}

                        <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left', paddingInline: '0.25rem' }}>
                          {formatTime(msg.createdAt)}
                          {isMe && <span style={{ marginLeft: '0.3rem' }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Alt Mesaj & Dosya/Konum Gönderme Alanı */}
            <div style={{ borderTop: '1px solid #F3F4F6', padding: '0.75rem 1rem', background: '#fff' }}>
              <form onSubmit={handleSendText} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                
                {/* Gizli Dosya İnputu */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                {/* Fotoğraf Yükle Butonu */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Fotoğraf Gönder"
                  style={{
                    background: '#F3F4F6', border: 'none', color: '#4B5563',
                    width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    flexShrink: 0, boxShadow: 'none',
                  }}
                >
                  🖼️
                </button>

                {/* Buluşma Teklif Et Butonu */}
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  title="Buluşma Noktası Teklif Et"
                  style={{
                    background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E',
                    width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    flexShrink: 0, boxShadow: 'none',
                  }}
                >
                  📍
                </button>

                <textarea
                  ref={textareaRef}
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mesaj yaz… (Enter = gönder)"
                  rows={1}
                  maxLength={1000}
                  style={{
                    flex: 1, resize: 'none', border: '1.5px solid #E5E7EB', borderRadius: '0.75rem',
                    padding: '0.6rem 0.875rem', fontFamily: 'inherit', fontSize: '0.875rem',
                    lineHeight: 1.5, outline: 'none', transition: 'border-color 0.2s',
                    maxHeight: 100, overflowY: 'auto',
                  }}
                  onFocus={e  => (e.target.style.borderColor = '#8B1A1A')}
                  onBlur={e   => (e.target.style.borderColor = '#E5E7EB')}
                />

                <button
                  type="submit"
                  disabled={sending || !newText.trim()}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: newText.trim() ? 'linear-gradient(135deg,#8B1A1A,#A82020)' : '#E5E7EB',
                    color: newText.trim() ? '#fff' : '#9CA3AF', border: 'none', cursor: newText.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', boxShadow: newText.trim() ? '0 2px 8px rgba(139,26,26,0.3)' : 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Buluşma Noktası Teklifi Modalı */}
      {showLocationModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="card animate-slide-up"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', border: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📍</span> Buluşma Noktası Teklifi
              </h2>
              <button onClick={() => setShowLocationModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'none' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">FÜ Kampüs Teslimat Noktası Seçin</label>
                <select
                  className="form-input"
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  style={{ fontFamily: 'inherit' }}
                >
                  {FU_CAMPUS_LOCATIONS.filter(l => l !== 'Tüm Kampüs Noktaları').map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Buluşma Saati</label>
                <input
                  type="time"
                  className="form-input"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSendLocationOffer}
                  className="btn btn-gold"
                  style={{ flex: 1 }}
                >
                  Teklifi Gönder 📍
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
