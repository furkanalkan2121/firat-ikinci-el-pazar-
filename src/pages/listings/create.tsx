import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { addListing } from '../../lib/localStore';

const CATEGORIES = [
  { label: 'Kitap & Ders Materyali', emoji: '📚' },
  { label: 'Elektronik',             emoji: '💻' },
  { label: 'Mobilya & Ev Eşyası',   emoji: '🛋️' },
  { label: 'Giyim & Aksesuar',      emoji: '👕' },
  { label: 'Spor & Outdoor',        emoji: '⚽' },
  { label: 'Diğer',                 emoji: '📦' },
];

/** Canvas API ile resmi sıkıştır (max 1000px, JPEG %80) */
async function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1000;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas başlatılamadı.'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Resim okunamadı.')); };
    img.src = objectUrl;
  });
}

export default function CreateListing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('');
  const [previews,    setPreviews]    = useState<string[]>([]);
  const [files,       setFiles]       = useState<File[]>([]);
  const [message,     setMessage]     = useState('');
  const [isError,     setIsError]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [progress,    setProgress]    = useState(0);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="fu-mark" style={{ margin: '0 auto 1rem', width: 48, height: 48 }}>FÜ</div>
            <p style={{ color: '#6B7280' }}>Yükleniyor…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  const handleFiles = (newFiles: File[]) => {
    setFiles(newFiles);
    setPreviews([]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setPreviews(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setIsError(true); setMessage('Başlık alanı zorunludur.'); return; }

    setSubmitting(true);
    setMessage('');
    setProgress(10);

    try {
      let imageDataUrls: string[] = [];

      if (files.length > 0) {
        setMessage('Resimler optimize ediliyor…');
        // Paralel sıkıştırma (Canvas, tamamen local)
        imageDataUrls = await Promise.all(files.map(f => compressToDataUrl(f)));
        setProgress(75);
      }

      setMessage('İlan kaydediliyor…');
      await addListing({
        title:       title.trim(),
        description: description.trim() || undefined,
        price:       price ? Number(price) : undefined,
        images:      imageDataUrls,
        ownerId:     user.uid,
        category:    category || undefined,
      });

      setProgress(100);
      setIsError(false);
      setMessage('İlan başarıyla oluşturuldu! Yönlendiriliyorsunuz…');
      setTimeout(() => router.push('/'), 1000);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || 'Bir hata oluştu.');
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)', padding: '2.5rem 1.25rem 4rem', minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Sayfa başlığı */}
          <div style={{ marginBottom: '1.75rem' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280', fontSize: '0.83rem', textDecoration: 'none', marginBottom: '1rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Geri dön
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>Yeni İlan Oluştur</h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.375rem' }}>
              Resimler cihazınızda işlenir — internet bağlantısı gerekmez.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Bölüm 1: Temel Bilgiler ── */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem', border: 'none' }}>
              <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#8B1A1A', color: '#fff', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>1</span>
                Temel Bilgiler
              </h2>

              {/* Başlık */}
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  İlan Başlığı <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input id="title" className="form-input" type="text"
                  placeholder="örn. 2. el laptop, Calculus kitabı, masa lambası…"
                  value={title} onChange={e => setTitle(e.target.value)} required maxLength={80} />
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'right' }}>{title.length}/80</span>
              </div>

              {/* Kategori */}
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.label} type="button" onClick={() => setCategory(cat.label === category ? '' : cat.label)}
                      style={{
                        padding: '0.4rem 0.85rem', borderRadius: '999px',
                        border: `1.5px solid ${category === cat.label ? '#8B1A1A' : '#E5E7EB'}`,
                        background: category === cat.label ? '#FFF5F5' : '#fff',
                        color: category === cat.label ? '#8B1A1A' : '#374151',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                        transition: 'all 0.2s', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: 'none',
                      }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Açıklama */}
              <div className="form-group">
                <label className="form-label" htmlFor="description">Açıklama</label>
                <textarea id="description" className="form-input form-textarea"
                  placeholder="Ürününüzü detaylıca tanıtın: durumu, özellikleri, neden satıyorsunuz…"
                  value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} />
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'right' }}>{description.length}/1000</span>
              </div>

              {/* Fiyat */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="price">Fiyat (TL)</label>
                <div style={{ position: 'relative', maxWidth: '200px' }}>
                  <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#8B1A1A', pointerEvents: 'none' }}>₺</span>
                  <input id="price" className="form-input" type="number" placeholder="0" min="0" step="1"
                    value={price} onChange={e => setPrice(e.target.value)} style={{ paddingLeft: '2rem' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Boş bırakırsanız "Fiyat Yok" olarak görünür.</span>
              </div>
            </div>

            {/* ── Bölüm 2: Fotoğraflar ── */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem', border: 'none' }}>
              <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#8B1A1A', color: '#fff', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>2</span>
                Fotoğraflar
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 400 }}>— tamamen yerel, sunucuya gönderilmez</span>
              </h2>

              <div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1.5"
                  style={{ margin: '0 auto 0.75rem', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Fotoğraf yüklemek için tıklayın
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>veya sürükleyip bırakın · PNG, JPG, WEBP</p>
                <input id="file-input" type="file" multiple accept="image/*" onChange={handleInputChange} style={{ display: 'none' }} />
              </div>

              {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid #E5E7EB', position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Önizleme ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && (
                        <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#8B1A1A', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>Kapak</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İlerleme çubuğu */}
            {submitting && progress > 0 && progress < 100 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8B1A1A, #C9A227)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.375rem' }}>{message || `%${progress}`}</p>
              </div>
            )}

            {/* Mesaj */}
            {message && !submitting && (
              <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
                {message}
              </div>
            )}

            {/* Butonlar */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Link href="/" className="btn btn-outline">Vazgeç</Link>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
                {submitting ? 'Kaydediliyor…' : '🚀 İlanı Yayınla'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
