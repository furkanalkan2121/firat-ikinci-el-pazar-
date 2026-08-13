/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 * Kodu doğrular; doğruysa hesabın şifresini günceller.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';

export const config = { maxDuration: 30 };

const emailKey = (email: string) => email.trim().toLowerCase();
const hashCode = (code: string, email: string) =>
  createHash('sha256').update(`reset:${code}:${emailKey(email)}`).digest('hex');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST.' });

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !code) return res.status(400).json({ error: 'Eksik bilgi.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı.' });

    const { adminAuth, adminDb } = await import('../../../lib/firebaseAdmin');

    const ref = adminDb().collection('resetCodes').doc(emailKey(email));
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

    // Kod doğru — şifreyi güncelle
    const userRecord = await adminAuth().getUserByEmail(email);
    await adminAuth().updateUser(userRecord.uid, { password: newPassword });
    await ref.delete().catch(() => {});
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    const msg = err?.errorInfo?.message || err?.message || String(err);
    return res.status(500).json({ error: msg });
  }
}
