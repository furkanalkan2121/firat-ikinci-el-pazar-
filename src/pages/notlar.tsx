import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getCourseNotes,
  addCourseNote,
  incrementNoteDownload,
  type CourseNote,
} from '../lib/localNotes';
import { FU_FACULTIES } from '../lib/localStore';

export default function NotlarPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [selectedDept, setSelectedDept] = useState('Tüm Bölümler');
  const [selectedTerm, setSelectedTerm] = useState('Tümü');
  const [search, setSearch] = useState('');

  // Yükleme Modalı
  const [showModal, setShowModal] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState(FU_FACULTIES[1]);
  const [term, setTerm] = useState<any>('Vize');
  const [year, setYear] = useState('2025-2026');
  const [description, setDescription] = useState('');

  const loadData = () => {
    setNotes(getCourseNotes());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fu_notes_updated', loadData);
    return () => window.removeEventListener('fu_notes_updated', loadData);
  }, []);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Ders notu paylaşmak için giriş yapmalısınız.', 'info');
      return;
    }
    if (!courseName.trim() || !description.trim()) return;

    addCourseNote({
      courseName: courseName.trim(),
      department,
      term,
      year,
      uploaderName: user.email.split('@')[0],
      uploaderId: user.uid,
      description: description.trim(),
    });

    setShowModal(false);
    showToast('Ders notunuz başarıyla paylaşıldı! 📚', 'success');
    setCourseName('');
    setDescription('');
  };

  const handleDownload = (n: CourseNote) => {
    incrementNoteDownload(n.id);
    showToast(`"${n.courseName}" notu indiriliyor… 📥`, 'success');
  };

  // Filtreleme
  const filteredNotes = notes.filter(n => {
    const matchesDept = selectedDept === 'Tüm Bölümler' || n.department === selectedDept;
    const matchesTerm = selectedTerm === 'Tümü' || n.term === selectedTerm;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || n.courseName.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
    return matchesDept && matchesTerm && matchesSearch;
  });

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Üst Başlık & Not Paylaş Butonu */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>FÜ AKADEMİK HAVUZ</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Çıkmış Sorular &amp; Not Deposu</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', margin: '0.25rem 0 0' }}>
                FÜ Ders Notları &amp; Çıkmış Sorular 📚
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Geçmiş yıl Vize, Final, Büt sorularını ve ders notlarını ücretsiz indirin veya arkadaşlarınızla paylaşın.
              </p>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  showToast('Ders notu yüklemek için giriş yapmalısınız.', 'info');
                  return;
                }
                setShowModal(true);
              }}
              className="btn btn-gold"
              style={{ fontWeight: 800, padding: '0.75rem 1.25rem' }}
            >
              + Ders Notu / Çıkmış Soru Paylaş
            </button>
          </div>

          {/* Filtreleme Çubuğu */}
          <div className="card" style={{ padding: '1.25rem', border: 'none', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Dönem Sekmeleri */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Tümü', 'Vize', 'Final', 'Büt', 'Ders Notu'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerm(t)}
                    style={{
                      padding: '0.4rem 0.85rem', borderRadius: '999px',
                      border: selectedTerm === t ? '1.5px solid #8B1A1A' : '1px solid #E5E7EB',
                      background: selectedTerm === t ? '#FFF5F5' : '#fff',
                      color: selectedTerm === t ? '#8B1A1A' : '#4B5563',
                      fontWeight: selectedTerm === t ? 700 : 500, fontSize: '0.8rem',
                      cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'none',
                    }}
                  >
                    {t}
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
                  placeholder="Ders adı veya konu ara…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB',
                    fontSize: '0.82rem', outline: 'none', background: '#fff', width: 170
                  }}
                />
              </div>

            </div>
          </div>

          {/* Not Kartları Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredNotes.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Aramanıza Uygun Not Bulunamadı</h3>
                <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Ders notu ekleyen ilk öğrenci siz olabilirsiniz!</p>
              </div>
            ) : (
              filteredNotes.map(n => (
                <div
                  key={n.id}
                  className="card animate-slide-up"
                  style={{ padding: '1.25rem', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>{n.term}</span>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{n.year}</span>
                    </div>

                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem', lineHeight: 1.3 }}>
                      {n.courseName}
                    </h2>

                    <div style={{ fontSize: '0.75rem', color: '#8B1A1A', fontWeight: 600, marginBottom: '0.65rem' }}>
                      🏛️ {n.department}
                    </div>

                    <p style={{ fontSize: '0.83rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1rem' }}>
                      {n.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                      👤 {n.uploaderName} • 📥 {n.downloadsCount} İndirme
                    </div>
                    <button
                      onClick={() => handleDownload(n)}
                      className="btn btn-gold btn-sm"
                      style={{ fontWeight: 800, fontSize: '0.78rem' }}
                    >
                      📄 Ücretsiz İndir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Not Yükleme Modalı */}
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
            style={{ width: '100%', maxWidth: '500px', padding: '1.75rem', border: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📚</span> Ders Notu / Çıkmış Soru Paylaş
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'none' }}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Ders Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="örn. Calculus I, Anatomi, Fizik II"
                  className="form-input"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
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
                  <label className="form-label">Tür</label>
                  <select className="form-input" value={term} onChange={e => setTerm(e.target.value as any)}>
                    {['Vize', 'Final', 'Büt', 'Ders Notu'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Açıklama &amp; Not İçeriği *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Hangi konuları kapsıyor, çözümlü mü vb…"
                  className="form-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="btn btn-gold" style={{ flex: 1, fontWeight: 800 }}>Paylaş 📚</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
