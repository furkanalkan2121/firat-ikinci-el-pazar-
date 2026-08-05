import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getClubs,
  joinClub,
  submitClubApplication,
  type Club,
} from '../../lib/localClubs';
import { useAuthGate } from '../../lib/authGate';

const CATEGORIES = ['Tüm Kategoriler', 'Teknoloji & Mühendislik', 'Kültür & Sanat', 'Spor & Doğa', 'Sosyal Sorumluluk'];

export default function TopluluklarPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const requireAuth = useAuthGate();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedCat, setSelectedCat] = useState('Tüm Kategoriler');
  const [search, setSearch] = useState('');
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);

  // Kulüp Başvuru Modalı State'leri
  const [showAppModal, setShowAppModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [appCategory, setAppCategory] = useState<any>('Teknoloji & Mühendislik');
  const [logoEmoji, setLogoEmoji] = useState('🏛️');
  const [studentNo, setStudentNo] = useState('');
  const [appDepartment, setAppDepartment] = useState('');
  const [appDesc, setAppDesc] = useState('');

  const loadData = () => {
    setClubs(getClubs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fu_clubs_updated', loadData);
    return () => window.removeEventListener('fu_clubs_updated', loadData);
  }, []);

  const handleJoin = (club: Club) => {
    if (!requireAuth('Kulübe katılmak için lütfen giriş yapın.')) return;

    if (joinedClubs.includes(club.id)) {
      showToast(`Zaten ${club.name} kulübüne üyesiniz!`, 'info');
      return;
    }

    joinClub(club.id);
    setJoinedClubs([...joinedClubs, club.id]);
    showToast(`Tebrikler! ${club.name} kulübüne üye oldunuz. 🎉`, 'success');
  };

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Başvuru yapmak için lütfen giriş yapın.', 'info');
      return;
    }
    if (!clubName.trim() || !appDesc.trim() || !studentNo.trim()) return;

    submitClubApplication({
      clubName: clubName.trim(),
      category: appCategory,
      logoEmoji: logoEmoji || '🏛️',
      applicantEmail: user.email,
      applicantName: user.email.split('@')[0],
      studentNo: studentNo.trim(),
      department: appDepartment.trim() || 'Fırat Üniversitesi',
      description: appDesc.trim(),
    });

    setShowAppModal(false);
    showToast('Kulüp başkanlığı başvurunuz alındı! Yönetim (Admin) onayından sonra aktif edilecektir. 🏛️', 'success');
    setClubName('');
    setStudentNo('');
    setAppDesc('');
  };

  const filteredClubs = clubs.filter(c => {
    const matchesCat = selectedCat === 'Tüm Kategoriler' || c.category === selectedCat;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Üst Başlık & Başvuru Yap Butonu */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>FÜ ÖĞRENCİ TOPLULUKLARI</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Resmi Öğrenci Kulüpleri Portalı</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', margin: '0.25rem 0 0' }}>
                FÜ Kulüpler &amp; Topluluklar 👑
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                İlgi alanınıza uygun kulüplere katılın, etkinlikleri takip edin veya kendi kulübünüzü kurun.
              </p>
            </div>

            <button
              onClick={() => {
                if (!requireAuth('Kulüp açmak / Başkanlık başvurusu yapmak için lütfen giriş yapın.')) return;
                setShowAppModal(true);
              }}
              className="btn btn-gold"
              style={{ fontWeight: 800, padding: '0.75rem 1.25rem' }}
            >
              + Yeni Kulüp / Başkanlık Başvurusu
            </button>
          </div>

          {/* Filtre Barı */}
          <div className="card" style={{ padding: '1.25rem', border: 'none', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Kategori Sekmeleri */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    style={{
                      padding: '0.4rem 0.85rem', borderRadius: '999px',
                      border: selectedCat === cat ? '1.5px solid #8B1A1A' : '1px solid #E5E7EB',
                      background: selectedCat === cat ? '#FFF5F5' : '#fff',
                      color: selectedCat === cat ? '#8B1A1A' : '#4B5563',
                      fontWeight: selectedCat === cat ? 700 : 500, fontSize: '0.8rem',
                      cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'none',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Arama */}
              <input
                type="text"
                placeholder="Kulüp adı ara…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB',
                  fontSize: '0.82rem', outline: 'none', background: '#fff', width: 180
                }}
              />

            </div>
          </div>

          {/* Kulüp Kartları Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
            {filteredClubs.map(club => {
              const isLeader = user && (user.email === club.leaderEmail || user.email.includes('admin') || user.email === 'demo@firat.edu.tr');

              return (
                <div
                  key={club.id}
                  className="card animate-slide-up"
                  style={{
                    padding: '1.5rem', border: isLeader ? '2px solid #059669' : 'none',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem',
                    position: 'relative', background: '#fff',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: '#FFF5F5', border: '1px solid #FEE2E2', fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {club.logoEmoji}
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                            {club.name}
                          </h2>
                          <span style={{ fontSize: '0.72rem', color: '#8B1A1A', fontWeight: 600 }}>
                            {club.category}
                          </span>
                        </div>
                      </div>

                      {isLeader && (
                        <span className="badge" style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.68rem', fontWeight: 800 }}>
                          👑 Kulüp Başkanı Sizsiniz
                        </span>
                      )}
                    </div>

                    {/* Açıklama */}
                    <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1rem' }}>
                      {club.description}
                    </p>

                    {/* Başkan & Üye Bilgisi */}
                    <div style={{ background: '#F9FAFB', padding: '0.6rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div><strong>👑 Kulüp Başkanı:</strong> {club.leaderName}</div>
                      <div><strong>👥 Üye Sayısı:</strong> {club.memberCount} Öğrenci</div>
                      {club.instagram && <div><strong>📸 Instagram:</strong> {club.instagram}</div>}
                    </div>

                    {/* Aktif Etkinlikler */}
                    {club.events && club.events.length > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #E5E7EB' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', marginBottom: '0.35rem' }}>
                          🎉 Yaklaşan Etkinlik:
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                          {club.events[0].title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                          📍 {club.events[0].location} • 📅 {club.events[0].date}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alt Butonlar */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/topluluklar/${club.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
                    >
                      Detay &amp; Etkinlikler
                    </Link>

                    {isLeader ? (
                      <Link
                        href={`/topluluklar/${club.id}`}
                        className="btn btn-gold btn-sm"
                        style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}
                      >
                        ✏️ Yönet
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleJoin(club)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
                      >
                        {joinedClubs.includes(club.id) ? '✓ Üyesiniz' : '🤝 Katıl'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Yeni Kulüp / Başkanlık Başvurusu Modalı */}
      {showAppModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowAppModal(false)}
        >
          <div
            className="card animate-slide-up"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', border: 'none', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🏛️</span> Yeni Kulüp / Başkanlık Başvurusu
              </h2>
              <button onClick={() => setShowAppModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'none' }}>✕</button>
            </div>

            <form onSubmit={handleApplicationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Kurulacak Kulüp / Topluluk Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="örn. FÜ Yapay Zeka & Veri Bilimi Topluluğu"
                  className="form-input"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Kategori</label>
                  <select className="form-input" value={appCategory} onChange={e => setAppCategory(e.target.value as any)}>
                    {CATEGORIES.filter(c => c !== 'Tüm Kategoriler').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Kulüp Logosu (Emoji)</label>
                  <input
                    type="text"
                    placeholder="🤖, 🎮, ⚽ vb."
                    className="form-input"
                    value={logoEmoji}
                    onChange={e => setLogoEmoji(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Öğrenci Numaranız *</label>
                  <input
                    type="text"
                    required
                    placeholder="210101000"
                    className="form-input"
                    value={studentNo}
                    onChange={e => setStudentNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Fakülteniz</label>
                  <input
                    type="text"
                    placeholder="Mühendislik Fakültesi"
                    className="form-input"
                    value={appDepartment}
                    onChange={e => setAppDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Kulüp Amacı &amp; Vizyonu *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Kulübün kuruluş amacı, yapılması planlanan etkinlikler ve öğrenci hedefleri…"
                  className="form-input"
                  value={appDesc}
                  onChange={e => setAppDesc(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: '#6B7280', background: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #F3F4F6' }}>
                ℹ️ Başvurunuz FÜ Yönetim Paneline (Admin) iletilecektir. Onaylandığında kulübünüz yayınlanacak ve <strong>{user?.email}</strong> adresi Kulüp Başkanı olarak yetkilendirilecektir.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAppModal(false)} className="btn btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="btn btn-gold" style={{ flex: 1, fontWeight: 800 }}>Başvuruyu Gönder 🏛️</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
