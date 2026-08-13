/**
 * POST /api/auth/send-reset-code
 * Body: { email }
 * KAYITLI bir hesap için şifre sıfırlama kodu üretir ve Gmail ile gönderir.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash, randomInt } from 'crypto';

export const config = { maxDuration: 30 };

const CODE_TTL_MS = 10 * 60 * 1000;
const emailKey = (email: string) => email.trim().toLowerCase();
const hashCode = (code: string, email: string) =>
  createHash('sha256').update(`reset:${code}:${emailKey(email)}`).digest('hex');

async function sendResetEmail(email: string, code: string) {
  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!user || !pass) throw new Error('Gmail ortam değişkenleri eksik (GMAIL_USER / GMAIL_APP_PASSWORD).');

  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user, pass },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 8000,
  });

  await transporter.sendMail({
    from: `"Fırat İkinci El" <${user}>`,
    to: email,
    subject: 'Fırat İkinci El — Şifre Sıfırlama Kodu',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#8B1A1A;margin:0 0 8px">Fırat İkinci El</h2>
        <p>Merhaba,</p>
        <p>Şifrenizi sıfırlamak için 6 haneli kodunuz:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#111;background:#F5F0EB;padding:16px;text-align:center;border-radius:8px">${code}</div>
        <p style="color:#6B7280;font-size:13px">Bu kod 10 dakika geçerlidir. Şifre sıfırlama talebinde bulunmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>`,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST.' });

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
    }

    const { adminAuth, adminDb } = await import('../../../lib/firebaseAdmin');

    // Hesap KAYITLI olmalı
    try {
      await adminAuth().getUserByEmail(email);
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'Bu e-posta ile kayıtlı bir hesap bulunamadı.' });
      }
      throw e;
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await adminDb().collection('resetCodes').doc(emailKey(email)).set({
      codeHash: hashCode(code, email),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      createdAt: Date.now(),
    });

    await sendResetEmail(email, code);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    const msg = err?.errorInfo?.message || err?.message || String(err);
    return res.status(500).json({ error: msg });
  }
}
