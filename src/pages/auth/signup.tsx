import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { signUpLocal } from '../../lib/localAuth';

export default function Signup() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [message, setMessage]   = useState('');
  const [isError, setIsError]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setIsError(true); setMessage('Şifreler eşleşmiyor.'); return; }
    if (password.length < 6)  { setIsError(true); setMessage('Şifre en az 6 karakter olmalıdır.'); return; }
    setLoading(true);
    setMessage('');
    try {
      signUpLocal(email, password);
      window.dispatchEvent(new StorageEvent('storage', { key: 'fu_current_user' }));
      setIsError(false);
      setMessage('Kayıt başarılı! Yönlendiriliyorsunuz…');
      setTimeout(() => router.push('/'), 800);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div
        style={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '3rem 1.25rem',
          background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)',
        }}
      >
        <div className="auth-card animate-slide-up" style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="fu-mark" style={{ width: 60, height: 60, fontSize: '1.25rem', margin: '0 auto 1rem' }}>FÜ</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
              Kayıt Ol
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Fırat İkinci El platformuna katılın</p>
          </div>

          <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #8B1A1A, #C9A227, transparent)', borderRadius: '2px', marginBottom: '1.75rem' }} />

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">E-posta Adresi</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input id="reg-email" className="form-input" type="email" placeholder="ornek@firat.edu.tr"
                  value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Şifre</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <input id="reg-password" className="form-input" type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  required style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#9CA3AF', display: 'flex', boxShadow: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '0.25rem' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : '#E5E7EB', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Şifre Tekrar</label>
              <input id="reg-confirm" className="form-input" type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)}
                required style={{ borderColor: confirm && password !== confirm ? '#EF4444' : undefined }} />
              {confirm && password !== confirm && (
                <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 500 }}>Şifreler eşleşmiyor</span>
              )}
            </div>

            {message && (
              <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1.125rem' }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? 'Kayıt yapılıyor…' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="divider">veya</div>
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
            Zaten hesabınız var mı?{' '}
            <Link href="/auth/signin" style={{ color: '#8B1A1A', fontWeight: 700, textDecoration: 'none' }}>Giriş Yap</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
