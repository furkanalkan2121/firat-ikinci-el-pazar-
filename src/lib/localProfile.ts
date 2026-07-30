/**
 * localProfile.ts
 * Kullanıcı profil fotoğraflarını (avatar) localStorage üzerinde yönetir.
 * Görsel data URL (base64) olarak `fu_avatar_<uid>` anahtarında saklanır.
 */

const AVATAR_PREFIX = 'fu_avatar_';

export function getAvatar(uid?: string | null): string | null {
  if (typeof window === 'undefined' || !uid) return null;
  return localStorage.getItem(AVATAR_PREFIX + uid);
}

export function setAvatar(uid: string, dataUrl: string): void {
  if (typeof window === 'undefined' || !uid) return;
  localStorage.setItem(AVATAR_PREFIX + uid, dataUrl);
  window.dispatchEvent(new Event('fu_avatar_updated'));
}

export function removeAvatar(uid: string): void {
  if (typeof window === 'undefined' || !uid) return;
  localStorage.removeItem(AVATAR_PREFIX + uid);
  window.dispatchEvent(new Event('fu_avatar_updated'));
}

/** Seçilen fotoğrafı kare biçiminde kırpıp küçülterek data URL üretir (Canvas API). */
export function compressAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas başlatılamadı.'));
      // Merkezden kare kırpma (cover)
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Resim okunamadı.')); };
    img.src = url;
  });
}
