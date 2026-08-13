import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

async function postJson(url: string, body: any) {
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Sunucuya ulaşılamadı (ağ hatası).');
  }
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) throw new Error(data?.error || `Sunucu hatası (${res.status})`);
  return data;
}

export default function ResetPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setLoading(true);
    try {
      await postJson('/api/auth/send-reset-code', { email });
      setIsError(false); setMessage(''); setCode(''); setStep('reset');
    } catch (err: any) {
      setIsError(true); setMessage(err.message || 'Kod gönderilemedi.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirm) { setIsError(true); setMessage('Şifreler eşleşmiyor.'); return; }
    if (newPassword.length < 6) { setIsError(true); setMessage('Yeni şifre en az 6 karakter olmalı.'); return; }
    setLoading(true);
    try {
      await postJson('/api/auth/reset-password', { email, code, newPassword });
      setIsError(false);
      setMessage('Şifreniz güncellendi! Giriş sayfasına yönlendiriliyorsunuz…');
      setTimeout(() => router.push('/auth/signin'), 1200);
    } catch (err: any) {
      setIsError(true); setMessage(err.message || 'Şifre sıfırlanamadı.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setMessage('');
    try {
      await postJson('/api/auth/send-reset-code', { email });
      setIsError(false); setMessage('Yeni bir kod gönderildi.');
    } catch (err: any) {
      setIsError(true); setMessage(err.message || 'Kod gönderilemedi.');
    } finally { setResending(false); }
  };

  return (
    <Layout>
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.25rem', background: 'linear-gradient(160deg, #F5F0EB 0%, #F0E8E8 100%)' }}>
        <div className="auth-card animate-slide-up" style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="fu-mark" style={{ width: 60, height: 60, fontSize: '1.25rem', margin: '0 auto 1rem' }}>FÜ</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>Şifremi Sıfırla</h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {step === 'email' ? 'Hesabınızın e-posta adresini girin' : <>Kod <strong>{email}</strong> adresine gönderildi</>}
            </p>
          </div>

          <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #8B1A1A, #C9A227, transparent)', borderRadius: '2px', marginBottom: '1.75rem' }} />

          {step === 'email' ? (
            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">E-posta Adresi</label>
                <input id="reset-email" className="form-input" type="email" placeholder="ornek@firat.edu.tr" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {message && <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1.125rem' }}>{message}</div>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? 'Kod gönderiliyor…' : 'Sıfırlama Kodu Gönder'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <div style={{ padding: '0.875rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#1E3A8A' }}>
                📧 E-postana 6 haneli sıfırlama kodu gönderdik. Gelen kutunu (ve spam) kontrol et.
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-code">6 Haneli Kod</label>
                <input id="reset-code" className="form-input" type="text" inputMode="numeric" maxLength={6} placeholder="______"
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.4em', fontWeight: 700, fontFamily: 'monospace' }} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-new">Yeni Şifre</label>
                <div style={{ position: 'relative' }}>
                  <input id="reset-new" className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#9CA3AF', display: 'flex', boxShadow: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm">Yeni Şifre Tekrar</label>
                <input id="reset-confirm" className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  style={{ borderColor: confirm && newPassword !== confirm ? '#EF4444' : undefined }} />
                {confirm && newPassword !== confirm && <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 500 }}>Şifreler eşleşmiyor</span>}
              </div>

              {message && <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1.125rem' }}>{message}</div>}

              <button type="submit" disabled={loading || code.length < 6} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? 'Güncelleniyor…' : 'Şifreyi Sıfırla'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.82rem' }}>
                <button type="button" onClick={() => { setStep('email'); setMessage(''); }} style={{ background: 'none', border: 'none', color: '#6B7280', fontWeight: 600, cursor: 'pointer', padding: 0, boxShadow: 'none' }}>← E-postayı Değiştir</button>
                <button type="button" onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', color: '#8B1A1A', fontWeight: 700, cursor: 'pointer', padding: 0, boxShadow: 'none' }}>{resending ? 'Gönderiliyor…' : 'Kodu Tekrar Gönder'}</button>
              </div>
            </form>
          )}

          <div className="divider">veya</div>
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
            <Link href="/auth/signin" style={{ color: '#8B1A1A', fontWeight: 700, textDecoration: 'none' }}>Giriş sayfasına dön</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
