import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAuthGate } from '../lib/authGate';
import {
  getSocialProfiles, getMyProfile, upsertSocialProfile, deleteMyProfile,
  likeUser, unlikeUser, getMyLikeTargets, getLikedMe, getMatches,
  blockUser, getBlockedByMe, reportProfile, type SocialProfile,
} from '../lib/localSocial';
import { FU_FACULTIES } from '../lib/localStore';
import { makeConvId } from '../lib/localMessages';
import { compressAvatar } from '../lib/localProfile';

const GOALS = [
  'Tüm İlanlar', 'Ders Çalışma 📚', 'Proje Ekibi 💻',
  'Ev / Oda Arkadaşı 🏠', 'Spor & Aktivite ⚽', 'Kahve & Sohbet ☕', 'Diğer',
];
const GRADES = ['Tüm Sınıflar', 'Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', 'Yüksek Lisans', 'Doktora'];
const REPORT_REASONS = ['Uygunsuz / Sakıncalı İçerik', 'Sahte Profil', 'Taciz / Rahatsız Etme', 'Spam', 'Diğer'];

function isVerified(email?: string) {
  return !!email && (email.includes('@firat.edu.tr') || email.includes('@ogr.firat.edu.tr'));
}

export default function TanismaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const requireAuth = useAuthGate();

  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [myProfile, setMyProfile] = useState<SocialProfile | null>(null);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [likedMe, setLikedMe] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [tab, setTab] = useState<'discover' | 'likes' | 'matches'>('discover');
  const [loading, setLoading] = useState(true);

  // Filtreler
  const [selectedGoal, setSelectedGoal] = useState('Tüm İlanlar');
  const [selectedDept, setSelectedDept] = useState('Tüm Bölümler');
  const [selectedGrade, setSelectedGrade] = useState('Tüm Sınıflar');
  const [search, setSearch] = useState('');

  // Profil modalı
  const [showModal, setShowModal] = useState(false);
  const [fName, setFName] = useState('');
  const [fDept, setFDept] = useState(FU_FACULTIES[1]);
  const [fGrade, setFGrade] = useState('1. Sınıf');
  const [fGoal, setFGoal] = useState<string>('Ders Çalışma 📚');
  const [fBio, setFBio] = useState('');
  const [fInstagram, setFInstagram] = useState('');
  const [fAvatar, setFAvatar] = useState<string | undefined>(undefined);
  const [hobbyInput, setHobbyInput] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Şikayet modalı
  const [reportTarget, setReportTarget] = useState<SocialProfile | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);

  const loadAll = async () => {
    const all = await getSocialProfiles();
    setProfiles(all);
    if (user) {
      const [mine, likes, liked, ms, bl] = await Promise.all([
        getMyProfile(user.uid), getMyLikeTargets(user.uid),
        getLikedMe(user.uid), getMatches(user.uid), getBlockedByMe(user.uid),
      ]);
      setMyProfile(mine); setMyLikes(likes); setLikedMe(liked); setMatches(ms); setBlocked(bl);
    } else {
      setMyProfile(null); setMyLikes([]); setLikedMe([]); setMatches([]); setBlocked([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    window.addEventListener('fu_social_updated', loadAll);
    return () => window.removeEventListener('fu_social_updated', loadAll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ── Profil işlemleri ── */
  const openProfileModal = () => {
    if (!requireAuth('Tanışma profili oluşturmak için giriş yapın.')) return;
    if (myProfile) {
      setFName(myProfile.name); setFDept(myProfile.department); setFGrade(myProfile.grade);
      setFGoal(myProfile.goal); setFBio(myProfile.bio); setFInstagram(myProfile.instagram || '');
      setFAvatar(myProfile.avatar); setHobbies(myProfile.hobbies || []);
    } else {
      setFName(''); setFDept(FU_FACULTIES[1]); setFGrade('1. Sınıf'); setFGoal('Ders Çalışma 📚');
      setFBio(''); setFInstagram(''); setFAvatar(undefined); setHobbies([]);
    }
    setHobbyInput('');
    setShowModal(true);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    try { setFAvatar(await compressAvatar(file)); }
    catch { showToast('Fotoğraf yüklenemedi.', 'error'); }
    finally { setUploadingAvatar(false); }
  };

  const addHobby = () => {
    const h = hobbyInput.trim();
    if (h && !hobbies.includes(h) && hobbies.length < 8) { setHobbies([...hobbies, h]); setHobbyInput(''); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!fName.trim() || !fBio.trim()) { showToast('İsim ve biyografi zorunludur.', 'error'); return; }
    setSavingProfile(true);
    try {
      await upsertSocialProfile(user!.uid, {
        userEmail: user!.email, name: fName.trim(), department: fDept, grade: fGrade,
        goal: fGoal, bio: fBio.trim(), hobbies, instagram: fInstagram.trim() || undefined, avatar: fAvatar,
      });
      setShowModal(false);
      showToast('Tanışma profiliniz kaydedildi! 🎓', 'success');
    } catch (err: any) {
      showToast(err.message || 'Profil kaydedilemedi.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || !window.confirm('Tanışma profilinizi silmek istediğinize emin misiniz?')) return;
    await deleteMyProfile(user.uid);
    showToast('Tanışma profiliniz silindi.', 'info');
  };

  /* ── Beğeni / Eşleşme / Sohbet ── */
  const handleLike = async (p: SocialProfile) => {
    if (!requireAuth('Beğenmek için giriş yapın.')) return;
    if (!myProfile) { showToast('Önce kendi tanışma profilini oluştur 🙂', 'info'); openProfileModal(); return; }
    const { matched } = await likeUser(user!.uid, p.userId);
    showToast(matched ? `🎉 ${p.name} ile eşleştiniz! Artık sohbet edebilirsiniz.` : `${p.name} beğenildi 👍 (karşılık bekl.)`, 'success');
  };

  const handleUnlike = async (p: SocialProfile) => {
    if (!user) return;
    await unlikeUser(user.uid, p.userId);
    showToast('Beğeni geri alındı.', 'info');
  };

  const handleChat = (p: SocialProfile) => {
    if (!requireAuth('Sohbet için giriş yapın.')) return;
    router.push(`/mesajlar/${makeConvId('social', user!.uid, p.userId)}`);
  };

  const handleBlock = async (p: SocialProfile) => {
    if (!requireAuth()) return;
    if (!window.confirm(`${p.name} adlı kişiyi engellemek istiyor musunuz? Profilleriniz birbirinize gösterilmez.`)) return;
    await blockUser(user!.uid, p.userId);
    showToast(`${p.name} engellendi.`, 'info');
  };

  const submitReport = async () => {
    if (!user || !reportTarget) return;
    await reportProfile(user.uid, reportTarget.userId, reportReason);
    setReportTarget(null);
    showToast('Şikayetiniz yöneticilere iletildi. 🛡️', 'success');
  };

  /* ── Listeleme ── */
  const passesFilters = (p: SocialProfile) => {
    const q = search.trim().toLowerCase();
    return (selectedGoal === 'Tüm İlanlar' || p.goal === selectedGoal)
      && (selectedDept === 'Tüm Bölümler' || p.department === selectedDept)
      && (selectedGrade === 'Tüm Sınıflar' || p.grade === selectedGrade)
      && (!q || p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q) || p.department.toLowerCase().includes(q));
  };

  const visibleProfiles = (() => {
    const others = profiles.filter(p => p.userId !== user?.uid && !blocked.includes(p.userId));
    if (tab === 'likes')   return others.filter(p => likedMe.includes(p.userId));
    if (tab === 'matches') return others.filter(p => matches.includes(p.userId));
    return others.filter(passesFilters);
  })();

  /* ── Profil kartı ── */
  const ProfileCard = (p: SocialProfile) => {
    const matched = matches.includes(p.userId);
    const iLiked = myLikes.includes(p.userId);
    const likesMe = likedMe.includes(p.userId);
    return (
      <div key={p.id} className="card" style={{ padding: '1.25rem', border: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
        {/* Üst: avatar + isim */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.avatar ? '#fff' : 'linear-gradient(135deg,#8B1A1A,#C9A227)', color: '#fff', fontWeight: 900, fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {p.avatar
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : p.name[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{p.name}</span>
              {isVerified(p.userEmail) && (
                <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.62rem', border: '1px solid #FDE68A', fontWeight: 700 }}>🎓 Onaylı FÜ</span>
              )}
              {matched && <span className="badge" style={{ background: '#059669', color: '#fff', fontSize: '0.62rem' }}>💚 Eşleşme</span>}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{p.department} • {p.grade}</div>
          </div>
        </div>

        <span className="badge badge-red" style={{ alignSelf: 'flex-start', fontSize: '0.72rem' }}>{p.goal}</span>
        <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>{p.bio}</p>

        {p.hobbies?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {p.hobbies.map(h => (
              <span key={h} style={{ background: '#F3F4F6', color: '#374151', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>#{h}</span>
            ))}
          </div>
        )}
        {p.instagram && <div style={{ fontSize: '0.75rem', color: '#8B1A1A', fontWeight: 600 }}>📸 {p.instagram}</div>}

        {likesMe && !matched && (
          <div style={{ fontSize: '0.72rem', color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.375rem', padding: '0.3rem 0.5rem', fontWeight: 600 }}>
            💛 Bu kişi seni beğendi! Geri beğenirsen eşleşirsiniz.
          </div>
        )}

        {/* Aksiyonlar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.25rem', flexWrap: 'wrap' }}>
          {matched ? (
            <button onClick={() => handleChat(p)} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>💬 Sohbet Et</button>
          ) : iLiked ? (
            <button onClick={() => handleUnlike(p)} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✓ Beğenildi (geri al)</button>
          ) : (
            <button onClick={() => handleLike(p)} className="btn btn-gold btn-sm" style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}>
              {likesMe ? '💚 Geri Beğen & Eşleş' : '❤️ Beğen'}
            </button>
          )}
          <button onClick={() => setReportTarget(p)} title="Şikayet Et" className="btn btn-outline btn-sm" style={{ padding: '0.4rem 0.6rem' }}>⚠️</button>
          <button onClick={() => handleBlock(p)} title="Engelle" className="btn btn-outline btn-sm" style={{ padding: '0.4rem 0.6rem' }}>🚫</button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Başlık */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>FÜ KAMPÜS SOSYAL</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Öğrenci Tanışma Panosu</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', margin: '0.25rem 0 0' }}>Kampüs Tanışma &amp; Eşleşme 🤝</h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Ders arkadaşı, proje ekibi, ev arkadaşı veya sohbet için FÜ öğrencileriyle tanış. Beğen, karşılıklı beğenide eşleş ve sohbet et!
              </p>
            </div>
            <button onClick={openProfileModal} className="btn btn-gold" style={{ fontWeight: 800, padding: '0.75rem 1.25rem' }}>
              {myProfile ? '✏️ Profilimi Düzenle' : '+ Tanışma Profili Oluştur'}
            </button>
          </div>

          {/* Kendi profil özetim */}
          {myProfile && (
            <div className="card" style={{ padding: '1rem 1.25rem', border: '1px solid #FDE68A', background: '#FFFDF9', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: myProfile.avatar ? '#fff' : 'linear-gradient(135deg,#8B1A1A,#C9A227)', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {myProfile.avatar
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={myProfile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : myProfile.name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: '#111827' }}>Profiliniz yayında: {myProfile.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{myProfile.goal} • {myProfile.department}</div>
              </div>
              <button onClick={handleDeleteProfile} className="btn btn-outline btn-sm" style={{ color: '#DC2626', borderColor: '#FCA5A5' }}>🗑 Profili Sil</button>
            </div>
          )}

          {/* Sekmeler */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {([['discover', '🔎 Keşfet'], ['likes', `💛 Beni Beğenenler (${likedMe.length})`], ['matches', `💚 Eşleşmelerim (${matches.length})`]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: tab === key ? '#8B1A1A' : '#fff', color: tab === key ? '#fff' : '#4B5563',
                  fontWeight: 700, fontSize: '0.82rem', boxShadow: tab === key ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtreler (sadece Keşfet) */}
          {tab === 'discover' && (
            <div className="card" style={{ padding: '1rem 1.25rem', border: 'none', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1 }}>
                {GOALS.map(g => (
                  <button key={g} onClick={() => setSelectedGoal(g)}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.78rem', boxShadow: 'none',
                      border: selectedGoal === g ? '1.5px solid #8B1A1A' : '1px solid #E5E7EB',
                      background: selectedGoal === g ? '#FFF5F5' : '#fff', color: selectedGoal === g ? '#8B1A1A' : '#4B5563',
                      fontWeight: selectedGoal === g ? 700 : 500,
                    }}>{g}</button>
                ))}
              </div>
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="form-input" style={{ width: 'auto', maxWidth: 220, padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}>
                {FU_FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="form-input" style={{ width: 'auto', padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="text" placeholder="İsim / biyografi ara…" value={search} onChange={e => setSearch(e.target.value)} className="form-input" style={{ width: 170, padding: '0.4rem 0.65rem', fontSize: '0.82rem' }} />
            </div>
          )}

          {/* Liste */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Yükleniyor…</div>
          ) : visibleProfiles.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', border: 'none' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{tab === 'matches' ? '💚' : tab === 'likes' ? '💛' : '🔎'}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                {tab === 'matches' ? 'Henüz eşleşmen yok' : tab === 'likes' ? 'Seni henüz kimse beğenmedi' : 'Aramana uygun profil bulunamadı'}
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                {tab === 'discover' ? 'Profil oluşturup diğer öğrencileri beğenerek başla!' : 'Keşfet sekmesinden profilleri beğenmeye başla.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {visibleProfiles.map(ProfileCard)}
            </div>
          )}
        </div>
      </div>

      {/* Profil Oluştur/Düzenle Modalı */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div className="card animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', border: 'none' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '1.25rem' }}>🤝 Tanışma Profili</h2>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: fAvatar ? '#fff' : 'linear-gradient(135deg,#8B1A1A,#C9A227)', color: '#fff', fontWeight: 900, fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {fAvatar
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={fAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (fName[0]?.toUpperCase() || '?')}
                </div>
                <label className="btn btn-outline btn-sm" style={{ cursor: uploadingAvatar ? 'wait' : 'pointer' }}>
                  {uploadingAvatar ? 'Yükleniyor…' : '📷 Fotoğraf Seç'}
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
                </label>
                {fAvatar && <button type="button" onClick={() => setFAvatar(undefined)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>Kaldır</button>}
              </div>

              <div>
                <label className="form-label">Adınız *</label>
                <input className="form-input" value={fName} onChange={e => setFName(e.target.value)} required maxLength={40} placeholder="örn. Ahmet Y." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Bölüm</label>
                  <select className="form-input" value={fDept} onChange={e => setFDept(e.target.value)}>
                    {FU_FACULTIES.filter(f => f !== 'Tüm Bölümler').map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sınıf</label>
                  <select className="form-input" value={fGrade} onChange={e => setFGrade(e.target.value)}>
                    {GRADES.filter(g => g !== 'Tüm Sınıflar').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Amacım</label>
                <select className="form-input" value={fGoal} onChange={e => setFGoal(e.target.value)}>
                  {GOALS.filter(g => g !== 'Tüm İlanlar').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Hakkımda *</label>
                <textarea className="form-input form-textarea" value={fBio} onChange={e => setFBio(e.target.value)} required maxLength={300} placeholder="Kendini kısaca tanıt, ne aradığını yaz…" style={{ minHeight: 80 }} />
              </div>

              <div>
                <label className="form-label">Instagram (isteğe bağlı)</label>
                <input className="form-input" value={fInstagram} onChange={e => setFInstagram(e.target.value)} placeholder="@kullaniciadi" maxLength={40} />
              </div>

              <div>
                <label className="form-label">Hobiler / İlgi Alanları</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="form-input" value={hobbyInput} onChange={e => setHobbyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHobby(); } }}
                    placeholder="örn. Satranç, yaz + Enter" maxLength={20} />
                  <button type="button" onClick={addHobby} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>Ekle</button>
                </div>
                {hobbies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {hobbies.map(h => (
                      <span key={h} onClick={() => setHobbies(hobbies.filter(x => x !== h))} style={{ background: '#FFF5F5', color: '#8B1A1A', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '999px', cursor: 'pointer' }}>#{h} ✕</span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ flex: 1 }}>{savingProfile ? 'Kaydediliyor…' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Şikayet Modalı */}
      {reportTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setReportTarget(null)}>
          <div className="card animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', border: 'none' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '1rem' }}>⚠️ {reportTarget.name} — Şikayet</h2>
            <select className="form-input" value={reportReason} onChange={e => setReportReason(e.target.value)} style={{ marginBottom: '1.25rem' }}>
              {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setReportTarget(null)} className="btn btn-outline btn-sm">İptal</button>
              <button onClick={submitReport} className="btn btn-sm" style={{ background: '#DC2626', color: '#fff', border: 'none', fontWeight: 700 }}>Gönder</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
