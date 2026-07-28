import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  WEEKLY_MENU,
  getMealRatings,
  addMealRating,
  type MealRating,
} from '../lib/localFood';

export default function YemekhanePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ratings, setRatings] = useState<MealRating[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const loadData = () => {
    setRatings(getMealRatings());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fu_meal_ratings_updated', loadData);
    return () => window.removeEventListener('fu_meal_ratings_updated', loadData);
  }, []);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Yorum yapmak için giriş yapmalısınız.', 'info');
      return;
    }
    if (!comment.trim()) return;

    addMealRating({
      userId: user.uid,
      userName: user.email.split('@')[0],
      stars,
      comment: comment.trim(),
    });

    setComment('');
    showToast('Yemek değerlendirmeniz eklendi! 🍜', 'success');
  };

  const currentMenu = WEEKLY_MENU[selectedDayIndex] || WEEKLY_MENU[0];
  const avgRating = ratings.length > 0
    ? (ratings.reduce((acc, curr) => acc + curr.stars, 0) / ratings.length).toFixed(1)
    : '5.0';

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(160deg,#F5F0EB 0%,#F0E8E8 100%)', minHeight: 'calc(100vh - 180px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          {/* Üst Başlık */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>FÜ KAMPÜS YAŞAM</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Rektörlük &amp; Kampüs Yemekhaneleri</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', margin: '0.25rem 0 0' }}>
                Günlük Yemek Menüsü &amp; Yorumlar 🍜
              </h1>
            </div>

            <div className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.9rem', fontWeight: 800, padding: '0.5rem 1rem' }}>
              ⭐ Yemekhane Puanı: {avgRating} / 5 ({ratings.length} Oy)
            </div>
          </div>

          {/* Gün Seçici Sekmeler */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {WEEKLY_MENU.map((item, idx) => (
              <button
                key={item.date}
                onClick={() => setSelectedDayIndex(idx)}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '0.625rem', border: 'none',
                  background: selectedDayIndex === idx ? 'linear-gradient(135deg,#6B1010,#8B1A1A)' : '#fff',
                  color: selectedDayIndex === idx ? '#fff' : '#374151',
                  fontWeight: selectedDayIndex === idx ? 800 : 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: selectedDayIndex === idx ? '0 4px 12px rgba(139,26,26,0.3)' : '0 2px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                }}
              >
                📅 {item.dayName}
              </button>
            ))}
          </div>

          {/* Yemekhane Menü Kartları (Öğle & Akşam) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            {/* Öğle Yemeği */}
            <div className="card animate-slide-up" style={{ padding: '1.5rem', border: 'none', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid #FEF3C7', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>☀️</span> Öğle Yemeği Menüsü
                </h2>
                <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700 }}>
                  11:30 - 14:00
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentMenu.lunch.map((food, i) => (
                  <li key={i} style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: '#C9A227', fontSize: '1.1rem' }}>•</span> {food}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed #E5E7EB', fontSize: '0.78rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
                <span>🔥 Kalori Değeri:</span>
                <span style={{ fontWeight: 700, color: '#8B1A1A' }}>~{currentMenu.calories} kcal</span>
              </div>
            </div>

            {/* Akşam Yemeği */}
            <div className="card animate-slide-up" style={{ padding: '1.5rem', border: 'none', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid #E0F2FE', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🌙</span> Akşam Yemeği Menüsü
                </h2>
                <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700 }}>
                  16:30 - 19:00
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentMenu.dinner.map((food, i) => (
                  <li key={i} style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: '#0369A1', fontSize: '1.1rem' }}>•</span> {food}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed #E5E7EB', fontSize: '0.78rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
                <span>🔥 Kalori Değeri:</span>
                <span style={{ fontWeight: 700, color: '#0369A1' }}>~{currentMenu.calories - 40} kcal</span>
              </div>
            </div>

          </div>

          {/* 💬 Öğrenci Yorumları & Değerlendirme Formu */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', background: '#fff' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💬</span> Öğrenci Yemekhane Değerlendirmeleri ({ratings.length})
            </h2>

            {/* Değerlendirme Formu */}
            <form onSubmit={handleRatingSubmit} style={{ marginBottom: '2rem', background: '#F9FAFB', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #F3F4F6' }}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Lezzet Puanınız</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
                    >
                      {s <= stars ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Yemek Hakkında Yorumunuz</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Bugünkü yemeğin lezzeti, porsiyonu veya sıcaklığı hakkında yorum yapın…"
                  className="form-input"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-gold btn-sm" style={{ fontWeight: 800 }}>
                Değerlendirmeyi Gönder 🍜
              </button>
            </form>

            {/* Yorum Listesi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ratings.map(r => (
                <div key={r.id} style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#111827' }}>{r.userName}</span>
                    <span style={{ color: '#D97706', fontSize: '0.8rem', fontWeight: 700 }}>{'⭐'.repeat(r.stars)}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0, lineHeight: 1.4 }}>{r.comment}</p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
