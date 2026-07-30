import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { isAdminUser } from '../../lib/auth';
import { useToast } from '../../context/ToastContext';
import {
  getClubById,
  updateClub,
  addClubEvent,
  type Club,
} from '../../lib/localClubs';

export default function ClubDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { showToast } = useToast();

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  // Başkan Düzenleme Modalı
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editLeaderName, setEditLeaderName] = useState('');

  // Yeni Etkinlik Modalı
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const loadData = () => {
    if (!id) return;
    const item = getClubById(id);
    setClub(item);
    if (item) {
      setEditDescription(item.description);
      setEditInstagram(item.instagram || '');
      setEditLeaderName(item.leaderName);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fu_clubs_updated', loadData);
    return () => window.removeEventListener('fu_clubs_updated', loadData);
  }, [id]);

  const isLeader = !!user && !!club && (user.email.toLowerCase() === club.leaderEmail.toLowerCase() || isAdminUser(user));

  const handleUpdateClubInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    updateClub(club.id, {
      description: editDescription.trim(),
      instagram: editInstagram.trim(),
      leaderName: editLeaderName.trim(),
    });
    setShowEditModal(false);
    showToast('Kulüp bilgileri başarıyla güncellendi! 👑', 'success');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    if (!eventTitle.trim() || !eventDate.trim() || !eventLocation.trim()) return;

    addClubEvent(club.id, {
      title: eventTitle.trim(),
      date: eventDate.trim(),
      location: eventLocation.trim(),
      description: eventDesc.trim(),
    });

    setShowEventModal(false);
    showToast('Yeni kulüp etkinliği yayınlandı! 🎉', 'success');
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
    setEventDesc('');
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="fu-mark" style={{ width: 48, height: 48 }}>FÜ</div>
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>Kulüp Bulunamadı</h2>
          <Link href="/topluluklar" className="btn btn-primary" style={{ marginTop: '1rem' }}>Topluluklara Dön</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <Link href="/topluluklar" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280', fontSize: '0.83rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
            ← Tüm Topluluklara Dön
          </Link>

          {/* Kulüp Başlık Kartı */}
          <div className="card animate-slide-up" style={{ padding: '2rem', border: 'none', marginBottom: '2rem', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '1rem', background: '#FFF5F5', border: '1px solid #FEE2E2', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {club.logoEmoji}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                    {club.name}
                  </h1>
                  <div style={{ fontSize: '0.85rem', color: '#8B1A1A', fontWeight: 700, marginTop: '0.2rem' }}>
                    {club.category} • 👥 {club.memberCount} Üye
                  </div>
                </div>
              </div>

              {/* Kulüp Başkanı ise Yönetim Butonları */}
              {isLeader && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    ✏️ Kulüp Bilgilerini Düzenle
                  </button>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="btn btn-gold btn-sm"
                    style={{ fontWeight: 800 }}
                  >
                    + Yeni Etkinlik / Duyuru Ekle
                  </button>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              {club.description}
            </p>

            <div style={{ background: '#F9FAFB', padding: '0.85rem 1.25rem', borderRadius: '0.625rem', border: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem', color: '#374151' }}>
              <div>👑 <strong>Kulüp Başkanı:</strong> {club.leaderName} ({club.leaderEmail})</div>
              {club.instagram && <div>📸 <strong>Instagram:</strong> {club.instagram}</div>}
            </div>
          </div>

          {/* Etkinlikler Bölümü */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🎉</span> Kulüp Etkinlikleri &amp; Workshoplar ({club.events.length})
              </h2>

              {isLeader && (
                <button onClick={() => setShowEventModal(true)} className="btn btn-gold btn-sm" style={{ fontWeight: 800 }}>
                  + Etkinlik Ekle
                </button>
              )}
            </div>

            {club.events.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                Henüz yayınlanmış bir etkinlik bulunmuyor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {club.events.map(ev => (
                  <div key={ev.id} style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #F3F4F6', background: '#FFFDF9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0 }}>{ev.title}</h3>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>📅 {ev.date}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>
                      📍 {ev.location}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                      {ev.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Kulüp Bilgilerini Düzenleme Modalı (Sadece Kulüp Başkanı) */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowEditModal(false)}>
          <div className="card animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '1.75rem', border: 'none' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>👑 Kulüp Bilgilerini Güncelle</h2>
            <form onSubmit={handleUpdateClubInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Başkan Unvanı / Adı</label>
                <input type="text" required className="form-input" value={editLeaderName} onChange={e => setEditLeaderName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Kulüp Tanıtımı &amp; Vizyonu</label>
                <textarea required rows={4} className="form-input" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Instagram Hesabı</label>
                <input type="text" placeholder="@kuluphesabi" className="form-input" value={editInstagram} onChange={e => setEditInstagram(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="btn btn-gold" style={{ flex: 1, fontWeight: 800 }}>Kaydet 👑</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Etkinlik Ekleme Modalı (Sadece Kulüp Başkanı) */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowEventModal(false)}>
          <div className="card animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '1.75rem', border: 'none' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>🎉 Yeni Etkinlik &amp; Duyuru Ekle</h2>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Etkinlik / Duyuru Başlığı *</label>
                <input type="text" required placeholder="örn. Python & Yapay Zeka Workshop" className="form-input" value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Tarih &amp; Saat *</label>
                  <input type="text" required placeholder="30 Temmuz - 15:00" className="form-input" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Konum / Mekan *</label>
                  <input type="text" required placeholder="Mühendislik Amfi-1" className="form-input" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Etkinlik Detayları *</label>
                <textarea required rows={3} placeholder="Etkinliğin içeriği ve kimlerin katılabileceği…" className="form-input" value={eventDesc} onChange={e => setEventDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="btn btn-gold" style={{ flex: 1, fontWeight: 800 }}>Yayınla 🎉</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
