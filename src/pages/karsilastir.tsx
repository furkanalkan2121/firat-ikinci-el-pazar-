import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { getListing, Listing } from '../lib/localStore';

export default function ComparePage() {
  const router = useRouter();
  const { id1, id2 } = router.query as { id1?: string; id2?: string };

  const [item1, setItem1] = useState<Listing | null>(null);
  const [item2, setItem2] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    Promise.all([
      id1 ? getListing(id1) : Promise.resolve(null),
      id2 ? getListing(id2) : Promise.resolve(null),
    ])
      .then(([l1, l2]) => {
        setItem1(l1);
        setItem2(l2);
      })
      .finally(() => setLoading(false));
  }, [router.isReady, id1, id2]);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="fu-mark" style={{ width: 48, height: 48 }}>FÜ</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          <div style={{ marginBottom: '1.75rem' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280', fontSize: '0.83rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
              ← Anasayfaya Dön
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              ⚖️ İlan Karşılaştırma Modu
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Seçtiğiniz iki ilanın fiyat, konum, bölüm ve durum özelliklerini kıyaslayın.
            </p>
          </div>

          {!item1 && !item2 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Karşılaştırılacak İlan Seçilmedi</h2>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Anasayfadan karşılaştırmak istediğiniz ilanların üzerindeki "⚖️ Karşılaştır" butonunu kullanabilirsiniz.</p>
              <Link href="/" className="btn btn-primary">İlanları İncele</Link>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem', border: 'none', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '1rem', color: '#6B7280', width: '20%' }}>Özellik</th>
                    <th style={{ padding: '1rem', color: '#8B1A1A', fontWeight: 800, width: '40%' }}>
                      {item1 ? item1.title : '1. İlan Seçilmedi'}
                    </th>
                    <th style={{ padding: '1rem', color: '#8B1A1A', fontWeight: 800, width: '40%' }}>
                      {item2 ? item2.title : '2. İlan Seçilmedi'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Görsel */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>Görsel</td>
                    <td style={{ padding: '1rem' }}>
                      {item1?.images?.[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item1.images[0]} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: '0.5rem' }} />
                      ) : '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {item2?.images?.[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item2.images[0]} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: '0.5rem' }} />
                      ) : '—'}
                    </td>
                  </tr>

                  {/* Fiyat */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>Fiyat</td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#8B1A1A', fontSize: '1.1rem' }}>
                      {item1?.price !== undefined ? `${item1.price} ₺` : 'Fiyat Yok'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#8B1A1A', fontSize: '1.1rem' }}>
                      {item2?.price !== undefined ? `${item2.price} ₺` : 'Fiyat Yok'}
                    </td>
                  </tr>

                  {/* Kategori */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>Kategori</td>
                    <td style={{ padding: '1rem' }}>{item1?.category || '—'}</td>
                    <td style={{ padding: '1rem' }}>{item2?.category || '—'}</td>
                  </tr>

                  {/* Fakülte / Bölüm */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>Bölüm / Fakülte</td>
                    <td style={{ padding: '1rem' }}>{item1?.department || '—'}</td>
                    <td style={{ padding: '1rem' }}>{item2?.department || '—'}</td>
                  </tr>

                  {/* Teslimat Noktası */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>📍 Kampüs Noktası</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#059669' }}>{item1?.location || 'Rektörlük Kampüsü'}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#059669' }}>{item2?.location || 'Rektörlük Kampüsü'}</td>
                  </tr>

                  {/* Takas Durumu */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>Takas Durumu</td>
                    <td style={{ padding: '1rem' }}>
                      {item1?.isExchange ? '📚 Sadece Takas' : item1?.allowTrade ? '🤝 Nakit & Takas Olur' : '❌ Sadece Nakit'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {item2?.isExchange ? '📚 Sadece Takas' : item2?.allowTrade ? '🤝 Nakit & Takas Olur' : '❌ Sadece Nakit'}
                    </td>
                  </tr>

                  {/* İlan Durumu */}
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#374151' }}>Durum</td>
                    <td style={{ padding: '1rem' }}>{item1?.isSold ? '🏷️ SATILDI' : '✅ Aktif Satışta'}</td>
                    <td style={{ padding: '1rem' }}>{item2?.isSold ? '🏷️ SATILDI' : '✅ Aktif Satışta'}</td>
                  </tr>

                  {/* Detay Butonu */}
                  <tr>
                    <td style={{ padding: '1rem' }}>İncele</td>
                    <td style={{ padding: '1rem' }}>
                      {item1?.id && (
                        <Link href={`/listings/${item1.id}`} className="btn btn-gold btn-sm">İlana Git →</Link>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {item2?.id && (
                        <Link href={`/listings/${item2.id}`} className="btn btn-gold btn-sm">İlana Git →</Link>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
