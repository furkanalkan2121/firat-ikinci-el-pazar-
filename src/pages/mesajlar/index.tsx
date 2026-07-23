import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { getUserConversations, type Conversation } from '../../lib/localMessages';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m} dk.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa.`;
  return `${Math.floor(h / 24)} gün`;
}

export default function MessagesInbox() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signin'); return; }
    setConversations(getUserConversations(user.uid));
    setPageLoading(false);
  }, [user, loading, router]);

  if (loading || pageLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="fu-mark" style={{ margin: '0 auto', width: 48, height: 48 }}>FÜ</div>
        </div>
      </Layout>
    );
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)', padding: '2.5rem 1.25rem 4rem', minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>

          {/* Başlık */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                Mesajlarım
              </h1>
              {totalUnread > 0 && (
                <span style={{ background: '#8B1A1A', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.78rem', fontWeight: 700 }}>
                  {totalUnread} yeni
                </span>
              )}
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {conversations.length === 0 ? 'Henüz mesajınız yok.' : `${conversations.length} konuşma`}
            </p>
          </div>

          {/* Boş durum */}
          {conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '1rem', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💬</div>
              <h2 style={{ fontWeight: 700, fontSize: '1.15rem', color: '#374151', marginBottom: '0.5rem' }}>Mesaj kutunuz boş</h2>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Bir ilana giderek satıcıya mesaj gönderebilirsiniz.
              </p>
              <Link href="/" className="btn btn-primary">İlanlara Göz At</Link>
            </div>
          )}

          {/* Konuşma listesi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/mesajlar/${encodeURIComponent(conv.id)}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '0.875rem',
                    padding: '1.125rem 1.25rem',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s',
                    border: `1.5px solid ${conv.unreadCount > 0 ? '#FECACA' : 'transparent'}`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-card)')}
                >
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #8B1A1A, #C9A227)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                    {conv.otherUserEmail[0].toUpperCase()}
                  </div>

                  {/* İçerik */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: conv.unreadCount > 0 ? 800 : 600, fontSize: '0.9rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.otherUserEmail}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', flexShrink: 0 }}>{timeAgo(conv.lastMessageAt)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#8B1A1A', fontWeight: 600, marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📦 {conv.listingTitle}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: conv.unreadCount > 0 ? '#374151' : '#9CA3AF', fontWeight: conv.unreadCount > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lastMessage}
                    </div>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#8B1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
}
