# 📚 Kütüphane Yönetim Sistemi

Modern, tam özellikli bir kütüphane yönetim sistemi. React 19 + Firebase altyapısı ile geliştirilmiştir.

🌐 **Canlı Demo:** [library-system-4cea8.web.app](https://library-system-4cea8.web.app)

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.10-FFCA28?logo=firebase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Özellikler

### 📖 Kitap Yönetimi
- Kitap ekleme, düzenleme ve silme
- Grid / Liste görünümü arasında geçiş
- Kategoriye göre filtreleme ve arama
- ISBN barkod tarama (kamera ile)
- Kitap detay modalı (kapak, açıklama, puan, sayfa sayısı)
- Kitap stok ve müsaitlik takibi
- Bekleme sırası / rezervasyon sistemi

### 💬 Yorum ve Değerlendirme
- Kitaplara ⭐ 1-5 yıldız puanlama
- Yorum yazma ve silme
- Kitap başına kullanıcı başına tek yorum kısıtlaması
- Ortalama puan hesaplama

### 👥 Üye Yönetimi
- Otomatik üye kaydı (Google veya e-posta ile kayıt olan kullanıcılar otomatik üye olur)
- Üye bilgileri: ad, e-posta, telefon
- Son giriş zamanına göre **dinamik aktiflik durumu** (30 gün kıstas)
- Üye arama ve filtreleme

### 🔄 Ödünç İşlemleri
- Kitap ödünç verme ve iade alma
- Durum takibi: Ödünç / Gecikmiş / İade
- Son tarih belirleme
- Gecikmiş kitap uyarıları

### 📊 Dashboard
- **Admin/Kütüphaneci:** İstatistik kartları, kategori dağılımı (pasta grafik), puan dağılımı (bar grafik), son ödünç işlemleri, popüler kitaplar, son yorumlar
- **Üye:** Hoş geldin mesajı, popüler kitaplar, son yorumlar

### 👤 Profil Sayfası
- Kullanıcı bilgileri ve istatistikleri
- Okunan kitap sayısı, toplam etkileşim
- Rozet sistemi
- Son ödünç işlemleri

### 🔐 Rol Tabanlı Yetkilendirme
| Rol | Yetkiler |
|-----|----------|
| **Admin** | Tüm CRUD işlemleri, üye yönetimi, ödünç işlemleri, istatistikler |
| **Kütüphaneci** | Kitap ve ödünç yönetimi, üye görüntüleme |
| **Üye** | Kitap görüntüleme, yorum yazma, profil, rezervasyon |
| **Test Kullanıcı** | Tüm roller arası geçiş yaparak test edebilme |

### 🧪 Test Modu
- Test kullanıcısı ile giriş yapıldığında sidebar'da rol değiştirme paneli
- Admin, Kütüphaneci ve Üye rolleri arasında anında geçiş
- Gerçek veritabanı rolünü değiştirmeden test etme imkânı

### 📥 Dışa Aktarma
- Kitaplar, üyeler ve ödünç işlemleri **CSV** ve **PDF** olarak dışa aktarma

### 🌍 Çoklu Dil Desteği
- 🇹🇷 Türkçe
- 🇬🇧 İngilizce
- Sidebar'dan tek tıkla dil değişimi

### 🎨 Tasarım
- Karanlık / Aydınlık tema desteği
- Glassmorphism efektleri
- Framer Motion animasyonları
- Tam responsive (mobil uyumlu)

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 19, React Router 7, Framer Motion |
| **Stil** | CSS Modules, CSS Custom Properties |
| **Durum Yönetimi** | React Context API, Custom Hooks |
| **Backend** | Firebase Auth, Cloud Firestore |
| **Grafikler** | Recharts |
| **Dışa Aktarma** | jsPDF, jsPDF-AutoTable, html2canvas |
| **Barkod** | @zxing/browser, html5-qrcode |
| **i18n** | i18next, react-i18next |
| **İkonlar** | Lucide React |
| **Build** | Vite 7.3 |
| **Deploy** | Firebase Hosting |

---

## 📁 Proje Yapısı

```
library-system-firebase/
├── public/                  # Statik dosyalar
├── scripts/                 # Veritabanı seed scriptleri
│   ├── import-books.cjs     # CSV'den kitap import
│   ├── seed-users.cjs       # Admin/tester kullanıcı oluşturma
│   └── serviceAccountKey.json
├── src/
│   ├── components/
│   │   ├── common/          # Toast, ScannerModal
│   │   └── layout/          # Sidebar, ProtectedRoute
│   ├── contexts/
│   │   └── AuthContext.jsx   # Auth + rol yönetimi + üye senkronizasyonu
│   ├── hooks/
│   │   ├── useBooks.js       # Kitap CRUD + arama
│   │   ├── useBorrows.js     # Ödünç işlemleri
│   │   ├── useMembers.js     # Üye yönetimi
│   │   └── useReviews.js     # Yorum/değerlendirme sistemi
│   ├── lib/
│   │   └── firebase.js       # Firebase config ve init
│   ├── locales/
│   │   ├── tr.json           # Türkçe çeviriler
│   │   └── en.json           # İngilizce çeviriler
│   ├── pages/
│   │   ├── DashboardPage.jsx # Ana sayfa (rol bazlı)
│   │   ├── BooksPage.jsx     # Kitap yönetimi + detay + yorum
│   │   ├── MembersPage.jsx   # Üye yönetimi
│   │   ├── BorrowsPage.jsx   # Ödünç işlemleri
│   │   ├── ProfilePage.jsx   # Kullanıcı profili
│   │   ├── LoginPage.jsx     # Giriş sayfası
│   │   └── RegisterPage.jsx  # Kayıt sayfası
│   ├── styles/               # Global CSS
│   ├── utils/
│   │   ├── helpers.js        # Yardımcı fonksiyonlar
│   │   └── exportUtils.js    # CSV/PDF dışa aktarma
│   ├── App.jsx               # Router + layout
│   ├── main.jsx              # Entry point
│   └── i18n.js               # i18n konfigürasyonu
├── .env                      # Firebase ortam değişkenleri
├── firebase.json             # Firebase Hosting config
├── vite.config.js            # Vite konfigürasyonu
└── package.json
```

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Firebase projesi

### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd library-system-firebase
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Firebase yapılandırması
`.env` dosyası oluşturun:
```env
VITE_API_KEY=your-api-key
VITE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PROJECT_ID=your-project-id
VITE_STORAGE_BUCKET=your-project.appspot.com
VITE_MESSAGING_SENDER_ID=your-sender-id
VITE_APP_ID=your-app-id
```

### 4. Firestore Koleksiyonları
Firebase Console'da aşağıdaki koleksiyonları oluşturun (veya seed script'leri kullanın):
- `users` — Kullanıcı profilleri ve rolleri
- `books` — Kitap verileri
- `members` — Üye kayıtları
- `borrows` — Ödünç işlemleri
- `reviews` — Kitap yorumları

### 5. Seed Verileri (Opsiyonel)

**Kitap verileri import etme:**
```bash
node scripts/import-books.cjs
```

**Admin ve test kullanıcıları oluşturma:**
```bash
node scripts/seed-users.cjs
```

### 6. Geliştirme sunucusunu başlatın
```bash
npm run dev
```
Uygulama `http://localhost:5173` adresinde açılacaktır.

---

## 📦 Deploy

### Firebase Hosting
```bash
# Production build
npm run build

# Firebase CLI ile deploy
npx firebase-tools deploy --only hosting
```

---

## 🔑 Demo Hesapları

| Hesap | E-posta | Şifre | Rol |
|-------|---------|-------|-----|
| Admin | admin@library.com | admin123456 | Tam yetki |
| Test Kullanıcı | tester@library.com | tester123456 | Rol değiştirici |

> Ayrıca Google hesabı ile de kayıt olabilirsiniz — otomatik olarak Üye rolü atanır.

---

## 🗃️ Firestore Veri Modeli

### `users` Koleksiyonu
```json
{
  "displayName": "string",
  "email": "string",
  "photoURL": "string | null",
  "role": "admin | librarian | member | tester",
  "lastLogin": "ISO string",
  "createdAt": "timestamp"
}
```

### `books` Koleksiyonu
```json
{
  "title": "string",
  "authors": "string",
  "isbn13": "string",
  "categories": "string",
  "published_year": "number",
  "num_pages": "number",
  "average_rating": "number",
  "description": "string",
  "thumbnail": "string",
  "quantity": "number",
  "available": "number",
  "reservations": "array"
}
```

### `members` Koleksiyonu
```json
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "status": "active | inactive",
  "uid": "string (Firebase Auth UID)",
  "lastLogin": "ISO string",
  "membershipDate": "YYYY-MM-DD",
  "createdAt": "timestamp"
}
```

### `borrows` Koleksiyonu
```json
{
  "bookId": "string",
  "bookTitle": "string",
  "memberId": "string",
  "memberName": "string",
  "borrowDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD | null",
  "status": "borrowed | returned | overdue",
  "createdAt": "timestamp"
}
```

### `reviews` Koleksiyonu
```json
{
  "bookId": "string",
  "bookTitle": "string",
  "userId": "string",
  "userName": "string",
  "userPhoto": "string | null",
  "rating": "1-5",
  "comment": "string",
  "createdAtISO": "ISO string",
  "createdAt": "timestamp"
}
```

---

## 📜 Scriptler

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Production build oluşturur |
| `npm run preview` | Build önizleme |
| `npm run lint` | ESLint kontrolü |

---

## 📄 Lisans

MIT License — Serbestçe kullanabilir, değiştirebilir ve dağıtabilirsiniz.
