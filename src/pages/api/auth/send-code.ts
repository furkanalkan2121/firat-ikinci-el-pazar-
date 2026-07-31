/**
 * POST /api/auth/send-code
 * Body: { email }
 * 6 haneli doğrulama kodu üretir, Firestore'a (hash'li) yazar ve Brevo ile e-posta gönderir.
 * Kod istemciye ASLA dönmez.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash, randomInt } from 'crypto';
import nodemailer from 'nodemailer';
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 dakika
const emailKey = (email: string) => email.trim().toLowerCase();
const hashCode = (code: string, email: string) =>
  createHash('sha256').update(`${code}:${emailKey(email)}`).digest('hex');

/** Kendi Gmail hesabından (Uygulama Şifresi ile) e-posta gönderir — Brevo vb. gerekmez. */
async function sendCodeEmail(email: string, code: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Gmail ortam değişkenleri eksik (GMAIL_USER / GMAIL_APP_PASSWORD).');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Fırat İkinci El" <${user}>`,
    to: email,
    subject: 'Fırat İkinci El — E-posta Doğrulama Kodu',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#8B1A1A;margin:0 0 8px">Fırat İkinci El</h2>
        <p>Merhaba,</p>
        <p>Hesabınızı doğrulamak için 6 haneli kodunuz:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#111;background:#F5F0EB;padding:16px;text-align:center;border-radius:8px">${code}</div>
        <p style="color:#6B7280;font-size:13px">Bu kod 10 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
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

    // Zaten kayıtlı mı?
    try {
      await adminAuth().getUserByEmail(email);
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
    } catch (e: any) {
      if (e?.code !== 'auth/user-not-found') throw e; // başka hata ise yükselt
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await adminDb().collection('emailCodes').doc(emailKey(email)).set({
      codeHash: hashCode(code, email),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      createdAt: Date.now(),
    });

    await sendCodeEmail(email, code);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Kod gönderilemedi.' });
  }
}
