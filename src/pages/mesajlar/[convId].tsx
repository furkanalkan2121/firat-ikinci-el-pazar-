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

export default function ConversationPage() {
  const router  = useRouter();
  const rawId   = router.query.convId;
  const convId  = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');
  const { user, loading } = useAuth();

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [newText,   setNewText]   = useState('');
  const [sending,   setSending]   = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !user || !convId || sending) return;

    // Karşı tarafı mesajlardan çıkar
    const other = messages.find(m => m.senderId !== user.uid) ??
                  messages.find(m => m.receiverId !== user.uid);
    const receiverId    = other ? (other.senderId === user.uid ? other.receiverId    : other.senderId)    : '';
    const receiverEmail = other ? (other.senderId === user.uid ? other.receiverEmail : other.senderEmail) : '';
    if (!receiverId) return;

    setSending(true);
    sendMessage({
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
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

  // Sohbet meta bilgileri
  const listingTitle    = messages[0]?.listingTitle ?? 'İlan';
  const listingId       = messages[0]?.listingId    ?? '';
  const otherMsg        = messages.find(m => m.senderId !== user!.uid);
  const otherUserEmail  = otherMsg
    ? (otherMsg.senderId === user!.uid ? otherMsg.receiverEmail : otherMsg.senderEmail)
    : '—';

  const isEmpty = messages.length === 0;

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem 2rem' }}>

          {/* ── Üst bar ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Link href="/mesajlar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-card)', color: '#374151', textDecoration: 'none', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>

            {/* Karşı kullanıcı */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, background: '#fff', borderRadius: '0.875rem', padding: '0.625rem 1rem', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8B1A1A,#C9A227)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                {otherUserEmail[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherUserEmail}</div>
                {listingId && (
                  <Link href={`/listings/${listingId}`}
                    style={{ fontSize: '0.72rem', color: '#8B1A1A', fontWeight: 600, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    📦 {listingTitle}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── Mesaj alanı ── */}
          <div style={{ flex: 1, background: '#fff', borderRadius: '1rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 400 }}>

            {/* Mesajlar */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isEmpty && (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
                  <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Henüz mesaj yok</p>
                  <p style={{ fontSize: '0.82rem' }}>İlk mesajı siz gönderin!</p>
                </div>
              )}

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
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', background: '#F9FAFB', padding: '0.2rem 0.75rem', borderRadius: '999px' }}>
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
                      <div style={{ maxWidth: '72%' }}>
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
                            boxShadow: isMe
                              ? '0 2px 8px rgba(139,26,26,0.25)'
                              : '0 1px 4px rgba(0,0,0,0.06)',
                          }}
                        >
                          {msg.text}
                        </div>
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

            {/* Mesaj yazma alanı */}
            <div style={{ borderTop: '1px solid #F3F4F6', padding: '0.875rem 1rem' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                <textarea
                  ref={textareaRef}
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mesaj yaz… (Enter = gönder, Shift+Enter = yeni satır)"
                  rows={1}
                  maxLength={1000}
                  style={{
                    flex: 1, resize: 'none', border: '1.5px solid #E5E7EB', borderRadius: '0.75rem',
                    padding: '0.625rem 0.875rem', fontFamily: 'inherit', fontSize: '0.875rem',
                    lineHeight: 1.5, outline: 'none', transition: 'border-color 0.2s',
                    maxHeight: 120, overflowY: 'auto',
                  }}
                  onFocus={e  => (e.target.style.borderColor = '#8B1A1A')}
                  onBlur={e   => (e.target.style.borderColor = '#E5E7EB')}
                />
                <button
                  type="submit"
                  disabled={sending || !newText.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
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
    </Layout>
  );
}
