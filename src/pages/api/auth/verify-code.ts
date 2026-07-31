/**
 * POST /api/auth/verify-code
 * Body: { email, code, password }
 * Kodu doğrular; doğruysa hesabı emailVerified:true olarak sunucuda oluşturur.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

const emailKey = (email: string) => email.trim().toLowerCase();
const hashCode = (code: string, email: string) =>
  createHash('sha256').update(`${code}:${emailKey(email)}`).digest('hex');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST.' });

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    const password = String(req.body?.password || '');

    if (!email || !code) return res.status(400).json({ error: 'Eksik bilgi.' });
    if (password.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });

    const ref = adminDb().collection('emailCodes').doc(emailKey(email));
    const snap = await ref.get();
    if (!snap.exists) return res.status(400).json({ error: 'Kod bulunamadı. Lütfen tekrar kod isteyin.' });

    const data = snap.data() as { codeHash: string; expiresAt: number; attempts: number };
    if (Date.now() > data.expiresAt) {
      await ref.delete().catch(() => {});
      return res.status(400).json({ error: 'Kodun süresi doldu. Lütfen yeni kod isteyin.' });
    }
    if ((data.attempts ?? 0) >= 5) {
      await ref.delete().catch(() => {});
      return res.status(429).json({ error: 'Çok fazla hatalı deneme. Lütfen yeni kod isteyin.' });
    }

    if (hashCode(code, email) !== data.codeHash) {
      await ref.update({ attempts: (data.attempts ?? 0) + 1 }).catch(() => {});
      return res.status(400).json({ error: 'Doğrulama kodu hatalı.' });
    }

    // Kod doğru — hesabı doğrulanmış olarak oluştur
    try {
      await adminAuth().createUser({ email, password, emailVerified: true });
    } catch (e: any) {
      if (e?.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
      }
      throw e;
    }
    await ref.delete().catch(() => {});
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Doğrulama başarısız.' });
  }
}
