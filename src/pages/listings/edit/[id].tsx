import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import { getListing, updateListing, type Listing } from '../../../lib/localStore';

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
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas başlatılamadı.'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Resim okunamadı.')); };
    img.src = objectUrl;
  });
}

export default function EditListing() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [listing,     setListing]     = useState<Listing | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('');
  const [department,  setDepartment]  = useState('Tüm Bölümler');
  const [isExchange,  setIsExchange]  = useState(false);
  const [allowTrade,  setAllowTrade]  = useState(false);
  const [existingImgs,setExistingImgs]= useState<string[]>([]);
  const [newFiles,    setNewFiles]    = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSold,      setIsSold]      = useState(false);

  const [message,     setMessage]     = useState('');
  const [isError,     setIsError]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (loading || !id) return;
    if (!user) { router.push('/auth/signin'); return; }

    getListing(id).then(item => {
      if (!item) {
        setListing(null);
      } else {
        if (item.ownerId !== user.uid) {
          router.push('/listings/my');
          return;
        }
        setListing(item);
        setTitle(item.title || '');
        setDescription(item.description || '');
        setPrice(item.price !== undefined ? String(item.price) : '');
        setCategory(item.category || '');
        setDepartment(item.department || 'Tüm Bölümler');
        setIsExchange(!!item.isExchange);
        setAllowTrade(!!item.allowTrade);
        setExistingImgs(item.images || []);
        setIsSold(!!item.isSold);
      }
      setPageLoading(false);
    });
  }, [id, user, loading, router]);

  if (loading || pageLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="fu-mark" style={{ width: 48, height: 48 }}>FÜ</div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>İlan Bulunamadı</h1>
          <Link href="/listings/my" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            İlanlarıma Dön
          </Link>
        </div>
      </Layout>
    );
  }

  const handleNewFiles = (files: File[]) => {
    setNewFiles(files);
    setNewPreviews([]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) setNewPreviews(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeExistingImg = (index: number) => {
    setExistingImgs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setIsError(true); setMessage('Başlık alanı zorunludur.'); return; }

    const priceNum = price.trim() ? Number(price) : undefined;
    if (priceNum !== undefined && (isNaN(priceNum) || priceNum < 0)) {
      setIsError(true); setMessage('Lütfen geçerli bir fiyat girin (0 veya üzeri).'); return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      let addedDataUrls: string[] = [];
      if (newFiles.length > 0) {
        addedDataUrls = await Promise.all(newFiles.map(f => compressToDataUrl(f)));
      }

      const updatedImages = [...existingImgs, ...addedDataUrls];

      const totalBytes = updatedImages.reduce((s, u) => s + u.length, 0);
      if (totalBytes > 900_000) {
        throw new Error('Görseller çok büyük. Lütfen daha az sayıda veya daha küçük fotoğraf yükleyin.');
      }

      await updateListing(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        category: category || undefined,
        department: department !== 'Tüm Bölümler' ? department : undefined,
        isExchange,
        allowTrade,
        images: updatedImages,
        isSold,
      });

      setIsError(false);
      setMessage('İlan başarıyla güncellendi! Yönlendiriliyorsunuz…');
      setTimeout(() => router.push(`/listings/${id}`), 1000);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || 'Güncelleme sırasında bir hata oluştu.');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)', padding: '2.5rem 1.25rem 4rem', minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <Link href={`/listings/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280', fontSize: '0.83rem', textDecoration: 'none', marginBottom: '1rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              İlana geri dön
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>İlanı Düzenle</h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Temel Bilgiler */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem', border: 'none' }}>
              <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', marginBottom: '1.25rem' }}>İlan Bilgileri</h2>

              {/* Satıldı durumu toggle */}
              <div style={{ padding: '0.875rem 1rem', background: isSold ? '#FEF2F2' : '#F0FDF4', border: `1.5px solid ${isSold ? '#FCA5A5' : '#86EFAC'}`, borderRadius: '0.625rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSold ? '#991B1B' : '#166534' }}>
                    {isSold ? '🏷️ İlan Satıldı Olarak İşaretli' : '✅ İlan Aktif Satışta'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                    {isSold ? 'Alıcılar ilanı "Satıldı" rozetiyle görür.' : 'İlanınız yayında ve alıcılar iletişime geçebilir.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSold(s => !s)}
                  className="btn btn-sm"
                  style={{
                    background: isSold ? '#22C55E' : '#EF4444',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  {isSold ? 'Aktife Al' : 'Satıldı Yap'}
                </button>
              </div>

              {/* Başlık */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">İlan Başlığı <span style={{ color: '#EF4444' }}>*</span></label>
                <input id="edit-title" className="form-input" type="text" value={title} onChange={e => setTitle(e.target.value)} required maxLength={80} />
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
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: 'none',
                      }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Takas / Değiş-Tokuş Seçenekleri */}
              <div className="form-group">
                <label className="form-label">Takas Durumu</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#FFFDF9', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #FDE68A' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#065F46' }}>
                    <input
                      type="checkbox"
                      checked={allowTrade}
                      onChange={e => setAllowTrade(e.target.checked)}
                      style={{ accentColor: '#059669', width: 16, height: 16 }}
                    />
                    🤝 Ürün Nakit Satışın Yanında Takasa da Uygundur
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#8B1A1A' }}>
                    <input
                      type="checkbox"
                      checked={isExchange}
                      onChange={e => setIsExchange(e.target.checked)}
                      style={{ accentColor: '#8B1A1A', width: 16, height: 16 }}
                    />
                    📚 Sadece Ders Kitabı / Materyal Ücretsiz Takas İlanıdır
                  </label>
                </div>
              </div>

              {/* Açıklama */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-desc">Açıklama</label>
                <textarea id="edit-desc" className="form-input form-textarea" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} />
              </div>

              {/* Fiyat */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="edit-price">Fiyat (TL)</label>
                <div style={{ position: 'relative', maxWidth: '200px' }}>
                  <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#8B1A1A' }}>₺</span>
                  <input id="edit-price" className="form-input" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ paddingLeft: '2rem' }} />
                </div>
              </div>
            </div>

            {/* Fotoğraflar */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem', border: 'none' }}>
              <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', marginBottom: '1.25rem' }}>Fotoğraflar</h2>

              {/* Mevcut görseller */}
              {existingImgs.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.5rem' }}>Mevcut Fotoğraflar</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.625rem' }}>
                    {existingImgs.map((src, idx) => (
                      <div key={idx} style={{ aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', border: '2px solid #E5E7EB' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeExistingImg(idx)}
                          style={{ position: 'absolute', top: 3, right: 3, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeni fotoğraf ekleme */}
              <div className="upload-zone" onClick={() => document.getElementById('edit-file-input')?.click()}>
                <p style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem', marginBottom: '2px' }}>+ Yeni fotoğraflar ekle</p>
                <input id="edit-file-input" type="file" multiple accept="image/*" onChange={e => e.target.files && handleNewFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
              </div>

              {newPreviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {newPreviews.map((src, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid #C9A227' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Link href={`/listings/${id}`} className="btn btn-outline">İptal</Link>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
                {submitting ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
