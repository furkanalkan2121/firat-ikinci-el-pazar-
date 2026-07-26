import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getListings, deleteListing, type Listing } from '../lib/localStore';
import { getReports, updateReportStatus, type Report } from '../lib/localReports';
import { useToast } from '../context/ToastContext';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'reports'>('listings');
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Basit Admin Yetki Kontrolü (demo admin veya admin e-postası)
    const isAdmin = user && (user.email.includes('admin') || user.email === 'demo@firat.edu.tr');
    if (!user || !isAdmin) {
      showToast('Admin paneline erişim yetkiniz yok.', 'error');
      router.push('/');
      return;
    }

    getListings().then(setListings);
    setReports(getReports());
    setPageReady(true);
  }, [user, loading, router]);

  const handleDeleteListing = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" ilanını admin olarak silmek istediğinize emin misiniz?`)) return;
    await deleteListing(id);
    setListings(prev => prev.filter(l => l.id !== id));
    showToast(`"${title}" ilanı başarıyla silindi.`, 'info');
  };

  const handleResolveReport = (reportId: string, listingId: string) => {
    if (window.confirm('Bu şikayeti haklı bulup ilanı silmek istiyor musunuz?')) {
      deleteListing(listingId);
      updateReportStatus(reportId, 'resolved');
      setListings(prev => prev.filter(l => l.id !== listingId));
      setReports(getReports());
      showToast('Şikayet çözümlendi ve ilgili ilan kaldırıldı.', 'success');
    }
  };

  const handleDismissReport = (reportId: string) => {
    updateReportStatus(reportId, 'dismissed');
    setReports(getReports());
    showToast('Şikayet reddedildi.', 'info');
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

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const soldCount = listings.filter(l => l.isSold).length;

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>ADMIN PANELİ</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Fırat Üniversitesi Yönetimi</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', margin: '0.25rem 0 0' }}>
                Platform Yönetim Merkezi 🛡️
              </h1>
            </div>
            <Link href="/" className="btn btn-outline btn-sm">
              ← Siteye Dön
            </Link>
          </div>

          {/* İstatistik Barı */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', border: 'none' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📦</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B1A1A' }}>{listings.length}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>Toplam İlan</div>
            </div>
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', border: 'none' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏷️</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669' }}>{soldCount}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>Satılan Ürünler</div>
            </div>
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', border: 'none' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚠️</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingReportsCount > 0 ? '#DC2626' : '#6B7280' }}>
                {pendingReportsCount}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>Bekleyen Şikayetler</div>
            </div>
          </div>

          {/* Sekmeler */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('listings')}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                background: activeTab === 'listings' ? '#8B1A1A' : 'transparent',
                color: activeTab === 'listings' ? '#fff' : '#4B5563',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: 'none', transition: 'all 0.2s',
              }}
            >
              Tüm İlanlar ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                background: activeTab === 'reports' ? '#8B1A1A' : 'transparent',
                color: activeTab === 'reports' ? '#fff' : '#4B5563',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: 'none', transition: 'all 0.2s', position: 'relative',
              }}
            >
              Şikayet &amp; Raporlar ({reports.length})
              {pendingReportsCount > 0 && (
                <span style={{ marginLeft: '0.5rem', background: '#EF4444', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                  {pendingReportsCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Tüm İlanlar */}
          {activeTab === 'listings' && (
            <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {listings.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem', background: '#F9FAFB', borderRadius: '0.75rem',
                      border: '1px solid #E5E7EB', gap: '1rem', flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '0.5rem', overflow: 'hidden', background: '#E5E7EB', flexShrink: 0 }}>
                        {item.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>{item.title}</span>
                          {item.isSold && <span className="badge" style={{ background: '#EF4444', color: '#fff', fontSize: '0.68rem' }}>SATILDI</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6B7280', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span>Satıcı: {item.ownerId}</span>
                          <span>Fiyat: {item.price !== undefined ? `${item.price} ₺` : 'Fiyatsız'}</span>
                          <span>👁️ Görüntülenme: {item.viewsCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <Link href={`/listings/${item.id}`} target="_blank" className="btn btn-outline btn-sm">
                        İncele
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(item.id!, item.title)}
                        className="btn btn-sm"
                        style={{ background: '#EF4444', color: '#fff', border: 'none', fontWeight: 700 }}
                      >
                        İlanı Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Şikayetler */}
          {activeTab === 'reports' && (
            <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  Henüz bildirilen herhangi bir şikayet yok.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reports.map(rep => (
                    <div
                      key={rep.id}
                      style={{
                        padding: '1.25rem', background: rep.status === 'pending' ? '#FEF2F2' : '#F9FAFB',
                        borderRadius: '0.75rem', border: `1.5px solid ${rep.status === 'pending' ? '#FCA5A5' : '#E5E7EB'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>{rep.reason}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          Durum: {rep.status === 'pending' ? '⏳ Bekliyor' : rep.status === 'resolved' ? '✅ Çözüldü (Silindi)' : '❌ Reddedildi'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
                        Şikayet Edilen İlan: {rep.listingTitle}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                        Bildiren: <strong>{rep.reporterEmail}</strong> | Detay: {rep.details || 'Açıklama girilmedi'}
                      </p>

                      {rep.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleResolveReport(rep.id, rep.listingId)}
                            className="btn btn-sm"
                            style={{ background: '#DC2626', color: '#fff', border: 'none', fontWeight: 700 }}
                          >
                            İlanı Sil ve Şikayeti Onayla
                          </button>
                          <button
                            onClick={() => handleDismissReport(rep.id)}
                            className="btn btn-outline btn-sm"
                          >
                            Şikayeti Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
