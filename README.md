# 🎓 Fırat Üniversitesi İkinci El Eşya Platformu

Fırat Üniversitesi öğrenci ve personeline özel ikinci el eşya alım-satım platformu.

## ✨ Özellikler

- 📦 İlan oluşturma (fotoğraflı, kategorili, fiyatlı)
- 🔍 Gerçek zamanlı arama
- 💬 Alıcı-satıcı mesajlaşma sistemi
- 👤 Kullanıcı profil sayfası
- 📋 İlanlarım yönetimi (ekle, görüntüle, sil)
- 🗄️ Tamamen yerel veri (localStorage) — sunucu gerektirmez
- 🎨 Fırat Üniversitesi kurumsal tasarımı (bordo + altın)

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

## 🧪 Demo Hesabı

Hemen denemek için:
- **E-posta:** `demo@firat.edu.tr`
- **Şifre:** `demo1234`

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 |
| Dil | TypeScript |
| Stil | Tailwind CSS + Vanilla CSS |
| Veri | localStorage (Firebase hazır) |
| Auth | Mock auth (Firebase hazır) |

## 📁 Proje Yapısı

```
src/
├── components/     # Header, Footer, Layout
├── context/        # AuthContext (mock auth)
├── lib/            # localStore, localAuth, localMessages
└── pages/
    ├── auth/       # signin, signup
    ├── listings/   # [id], create, my
    ├── mesajlar/   # index, [convId]
    └── profil.tsx
```

## 🔒 Güvenlik Notu

Bu proje şu an **geliştirme/demo** modundadır. Üretim ortamı için:
- Firebase Auth entegrasyonu (`lib/localAuth.ts` → Firebase)
- Firebase Firestore (`lib/localStore.ts` → Firestore)
- Firebase Storage (resim yükleme)

Altyapı `lib/` klasöründe hazır, sadece geçiş yapılması yeterlidir.

---

**Fırat Üniversitesi** — Elazığ, Türkiye 🇹🇷
