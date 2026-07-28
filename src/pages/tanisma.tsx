import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getSocialProfiles,
  addSocialProfile,
  deleteSocialProfile,
  type SocialProfile,
} from '../lib/localSocial';
import { FU_FACULTIES } from '../lib/localStore';
import { sendMessage, makeConvId } from '../lib/localMessages';

const GOALS = [
  'Tüm İlanlar',
  'Ders Çalışma 📚',
  'Proje Ekibi 💻',
  'Ev / Oda Arkadaşı 🏠',
  'Spor & Aktivite ⚽',
  'Kahve & Sohbet ☕',
];

export default function TanismaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('Tüm İlanlar');
  const [selectedDept, setSelectedDept] = useState('Tüm Bölümler');
  const [search, setSearch] = useState('');

  // Modal durumları
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(FU_FACULTIES[1]);
  const [grade, setGrade] = useState('1. Sınıf');
  const [goal, setGoal] = useState<any>('Ders Çalışma 📚');
  const [bio, setBio] = useState('');
  const [hobbyInput, setHobbyInput] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);

  const loadData = () => {
    setProfiles(getSocialProfiles());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fu_social_updated', loadData);
    return () => window.removeEventListener('fu_social_updated', loadData);
  }, []);

  const handleAddHobby = () => {
    if (hobbyInput.trim() && !hobbies.includes(hobbyInput.trim())) {
      setHobbies([...hobbies, hobbyInput.trim()]);
      setHobbyInput('');
    }
  };

  const handleRemoveHobby = (h: string) => {
    setHobbies(hobbies.filter(x => x !== h));
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Tanışma ilanı vermek için giriş yapmalısınız.', 'info');
      return;
    }
    if (!name.trim() || !bio.trim()) return;

    addSocialProfile({
      userId: user.uid,
      userEmail: user.email,
      name: name.trim(),
      department,
      grade,
      goal,
      bio: bio.trim(),
      hobbies,
    });

    setShowModal(false);
    showToast('Tanışma ilanınız yayınlandı! 🎓', 'success');
    setName('');
    setBio('');
    setHobbies([]);
  };

  const handleStartChat = (p: SocialProfile) => {
    if (!user) {
      showToast('Sohbet başlatmak için lütfen giriş yapın.', 'info');
      router.push('/auth/signin');
      return;
    }

    if (user.uid === p.userId) {
      showToast('Kendi ilanınızla sohbet başlatamazsınız.', 'info');
      return;
    }

    const convId = makeConvId('social', user.uid, p.userId);
    sendMessage({
      conversationId: convId,
      listingId: 'social',
      listingTitle: `Tanışma: ${p.name} (${p.goal})`,
      senderId: user.uid,
      senderEmail: user.email,
      receiverId: p.userId,
      receiverEmail: p.userEmail,
      text: `Merhaba ${p.name}! Kampüs Tanışma ilanını gördüm: "${p.goal}". Tanışabilir miyiz? 👋`,
    });

    showToast('Mesajınız iletildi! Sohbet sayfasına yönlendiriliyorsunuz…', 'success');
    setTimeout(() => router.push(`/mesajlar/${convId}`), 800);
  };

  // Filtreleme
  const filteredProfiles = profiles.filter(p => {
    const matchesGoal = selectedGoal === 'Tüm İlanlar' || p.goal === selectedGoal;
    const matchesDept = selectedDept === 'Tüm Bölümler' || p.department === selectedDept;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q) || p.department.toLowerCase().includes(q);
    return matchesGoal && matchesDept && matchesSearch;
  });

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Başlık ve İlan Ver Butonu */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>FÜ KAMPÜS SOSYAL</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Öğrenci Tanışma Panosu</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', margin: '0.25rem 0 0' }}>
                Kampüs Tanışma &amp; Sosyal Kulüp 🤝
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Ders arkadaşı, proje ekibi, ev arkadaşı veya sosyal aktivite için FÜ öğrencileriyle tanışın!
              </p>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  showToast('İlan vermek için lütfen giriş yapın.', 'info');
                  router.push('/auth/signin');
                  return;
                }
                setShowModal(true);
              }}
              className="btn btn-gold"
              style={{ fontWeight: 800, padding: '0.75rem 1.25rem' }}
            >
              + Tanışma İlanı Yayınla
            </button>
          </div>

          {/* Filtre Barı */}
          <div className="card" style={{ padding: '1.25rem', border: 'none', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Amaç Chip Butonları */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {GOALS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGoal(g)}
                    style={{
                      padding: '0.4rem 0.85rem', borderRadius: '999px',
                      border: selectedGoal === g ? '1.5px solid #8B1A1A' : '1px solid #E5E7EB',
                      background: selectedGoal === g ? '#FFF5F5' : '#fff',
                      color: selectedGoal === g ? '#8B1A1A' : '#4B5563',
                      fontWeight: selectedGoal === g ? 700 : 500, fontSize: '0.8rem',
                      cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'none',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Fakülte Filtresi & Arama */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB',
                    fontSize: '0.82rem', outline: 'none', background: '#fff', fontFamily: 'inherit'
                  }}
                >
                  {FU_FACULTIES.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="İsim veya biyografi ara…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB',
                    fontSize: '0.82rem', outline: 'none', background: '#fff', width: 160
                  }}
                />
              </div>

            </div>
          </div>

          {/* Öğrenci Tanışma Kartları Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredProfiles.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Henüz Bu Kriterde Sosyal İlan Bulunmuyor</h3>
                <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>İlk tanışma ilanını siz yayınlayabilirsiniz!</p>
              </div>
            ) : (
              filteredProfiles.map(p => (
                <div
                  key={p.id}
                  className="card animate-slide-up"
                  style={{
                    padding: '1.25rem', border: 'none', display: 'flex', flexDirection: 'column',
                    justify: 'space-between', gap: '1rem', position: 'relative'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#8B1A1A,#C9A227)', color: '#fff', fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {p.name}
                            <span style={{ fontSize: '0.68rem', background: '#FEF3C7', color: '#92400E', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                              🎓 FÜ
                            </span>
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#6B7280' }}>
                            {p.department} • {p.grade}
                          </div>
                        </div>
                      </div>

                      {user && user.uid === p.userId && (
                        <button
                          onClick={() => {
                            if (confirm('İlanınızı kaldırmak istiyor musunuz?')) {
                              deleteSocialProfile(p.id);
                              showToast('Tanışma ilanınız kaldırıldı.', 'info');
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Amaç Rozeti */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span className="badge" style={{ background: '#059669', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.goal}
                      </span>
                    </div>

                    {/* Bio */}
                    <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5, margin: '0 0 1rem' }}>
                      "{p.bio}"
                    </p>

                    {/* Hobiler */}
                    {p.hobbies && p.hobbies.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {p.hobbies.map(h => (
                          <span key={h} style={{ fontSize: '0.7rem', background: '#F3F4F6', color: '#4B5563', padding: '0.2rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                            #{h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sohbet Başlat Butonu */}
                  <button
                    type="button"
                    onClick={() => handleStartChat(p)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    💬 Tanışmak İçin Mesaj At
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* İlan Oluşturma Modalı */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card animate-slide-up"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', border: 'none', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🎓</span> Tanışma İlanı Oluştur
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'none' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Adınız / Rumuzunuz *</label>
                <input
                  type="text"
                  required
                  placeholder="örn. Ahmet Y."
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Fakülte / Bölüm</label>
                  <select className="form-input" value={department} onChange={e => setDepartment(e.target.value)}>
                    {FU_FACULTIES.filter(f => f !== 'Tüm Bölümler').map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sınıfınız</label>
                  <select className="form-input" value={grade} onChange={e => setGrade(e.target.value)}>
                    {['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', 'Yüksek Lisans / Doktora'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Tanışma Amacınız *</label>
                <select className="form-input" value={goal} onChange={e => setGoal(e.target.value as any)}>
                  {GOALS.filter(g => g !== 'Tüm İlanlar').map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Kendinizden Bahsedin (Biyografi) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="İlgi alanlarınız, nasıl bir arkadaş aradığınız…"
                  className="form-input"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">İlgi Alanları / Hobiler</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="örn. Kodlama, Kahve, Satranç"
                    className="form-input"
                    value={hobbyInput}
                    onChange={e => setHobbyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddHobby(); } }}
                  />
                  <button type="button" onClick={handleAddHobby} className="btn btn-outline" style={{ flexShrink: 0 }}>Ekle</button>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {hobbies.map(h => (
                    <span key={h} style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      #{h}
                      <button type="button" onClick={() => handleRemoveHobby(h)} style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="btn btn-gold" style={{ flex: 1, fontWeight: 800 }}>Yayınla 🎓</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
