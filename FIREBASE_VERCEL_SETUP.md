# Firebase + Vercel Setup Заавар (Дэлгэрэнгүй)

## 📋 Stack Overview

- **Frontend Hosting**: Vercel (React app)
- **Backend API**: Vercel Serverless Functions
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **File Storage**: Firebase Storage
- **Email**: Firebase Cloud Functions + SendGrid/Resend

---

## 🔥 Phase 1: Firebase Project Setup

### 1. Firebase Console дээр проект үүсгэх

1. https://console.firebase.google.com руу оч
2. "Add project" эсвэл "Create a project" дарах
3. Project name оруулах (жишээ: `koreazar-app`)
4. Google Analytics сонгох (optional)
5. "Create project" дарах

### 2. Firebase Authentication тохируулах

1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** tab-д орох
3. Дараах sign-in methods-ийг идэвхжүүлэх:
   - ✅ **Email/Password** (Required)
   - ✅ **Google** (Optional, хэрэв хүсвэл)
   - ✅ **Facebook** (Optional, хэрэв хүсвэл)

### 3. Firestore Database үүсгэх

1. Firebase Console → **Firestore Database** → **Create database**
2. **Production mode** сонгох (эхлээд test mode ч болно)
3. Location сонгох (жишээ: `asia-northeast3` - Seoul)
4. "Enable" дарах

**Security Rules (эхлээд test, дараа нь production):**
```javascript
// Test rules (development only!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}

// Production rules (хэрэглэгч өөрсдөө бичэх хэрэгтэй)
```

### 4. Firebase Storage тохируулах

1. Firebase Console → **Storage** → **Get started**
2. **Start in production mode** эсвэл **Start in test mode** сонгох
3. Location сонгох (Firestore-тай ижил location)
4. "Done" дарах

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Бүх хүн унших боломжтой
      allow write: if request.auth != null;  // Зөвхөн нэвтэрсэн хэрэглэгч бичих
    }
  }
}
```

### 5. Firebase Config авах

1. Firebase Console → Project Settings (⚙️ gear icon)
2. **General** tab дээр scroll down
3. **Your apps** section → Web app нэмэх (</> icon)
4. App nickname оруулах (жишээ: `koreazar-web`)
5. "Register app" дарах
6. Config авах (дараах хэлбэртэй):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "koreazar-app.firebaseapp.com",
  projectId: "koreazar-app",
  storageBucket: "koreazar-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**⚠️ Энэ config-ийг хадгалах!**

---

## 📦 Phase 2: Frontend Dependencies суулгах

### Firebase SDK суулгах

```bash
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7
npm install firebase
```

### Нэмэлт packages (API calls-д)

```bash
npm install axios
```

### React Query (аль хэдийн байгаа)

```bash
npm install @tanstack/react-query
```

---

## 🔧 Phase 3: Firebase Configuration File үүсгэх

`.env` файл үүсгэх (`.gitignore` дотор байгаа тул GitHub-д орохгүй):

```bash
# .env файл үүсгэх
```

`.env` файл дотор:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=koreazar-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-app
VITE_FIREBASE_STORAGE_BUCKET=koreazar-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🚀 Phase 4: Vercel Deploy Setup

### 1. Vercel Account үүсгэх

1. https://vercel.com руу оч
2. "Sign Up" дарах
3. GitHub account-аараа sign up хийх (хялбар)
4. Vercel-д GitHub access өгөх

### 2. Vercel Project үүсгэх

**Арга 1: Vercel Dashboard (Web UI)**
1. Vercel Dashboard → "Add New..." → "Project"
2. GitHub repository сонгох (`khash-star/koreazar`)
3. Framework Preset: **Vite**
4. Root Directory: `zar-746103b7`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. "Deploy" дарах

**Арга 2: Vercel CLI**
```bash
# Vercel CLI суулгах
npm install -g vercel

# Login хийх
vercel login

# Project folder руу орох
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# Deploy хийх
vercel
```

### 3. Environment Variables Vercel дээр тохируулах

Vercel Dashboard → Project → Settings → Environment Variables:

Дараах variables нэмэх:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=koreazar-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-app
VITE_FIREBASE_STORAGE_BUCKET=koreazar-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Environment сонгох**: Production, Preview, Development (бүгдийг нь сонгох)

### 4. Custom Domain тохируулах (Optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Domain нэмэх (жишээ: `koreazar.com`)
3. DNS тохиргоо хийх (Vercel заавар өгнө)

---

## 🏗️ Phase 5: Code Structure (Migration хийхэд)

### Firestore Collections (Database хүснэгтүүд)

```
/users              - Хэрэглэгчийн мэдээлэл
/listings           - Зар мэдээлэл
/banner_ads         - Баннер зар
/banner_requests    - Баннер захиалга
/saved_listings     - Хадгалсан зар
/conversations      - Ярилцлага
/messages           - Мессеж
```

### Backend API Structure (Vercel Serverless Functions)

```
/api/
  /auth/
    login.js         - Нэвтрэх
    register.js      - Бүртгүүлэх
    me.js            - Хэрэглэгчийн мэдээлэл
  /listings/
    index.js         - GET, POST listings
    [id].js          - GET, PUT, DELETE listing
  /banners/
    index.js         - Banner operations
  /conversations/
    index.js         - Conversation operations
  /messages/
    index.js         - Message operations
  /upload/
    index.js         - File upload
```

---

## 💰 Firebase Pricing (Free Tier)

### Firebase Free Tier (Spark Plan):
- ✅ **Firebase Auth**: Unlimited (free)
- ✅ **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- ✅ **Storage**: 5 GB storage, 1 GB downloads/day
- ✅ **Hosting**: 10 GB storage, 360 MB/day transfer
- ✅ **Cloud Functions**: 2 million invocations/month

**⚠️ Firestore usage-г сайтар хянах хэрэгтэй!**

---

## 📚 Next Steps - Migration Plan

### Step 1: Firebase Config файл үүсгэх
- `src/firebase/config.js` үүсгэх

### Step 2: Authentication солих
- `base44.auth.me()` → `firebase.auth().currentUser`
- `base44.auth.redirectToLogin()` → Custom login page

### Step 3: API Client үүсгэх
- `src/api/apiClient.js` үүсгэх (axios ашиглан)
- Base44 SDK-ийн оронд custom API calls

### Step 4: Vercel API Routes үүсгэх
- `api/` folder үүсгэх
- Serverless functions бичих

### Step 5: Database schema Firestore-д үүсгэх
- Collections үүсгэх
- Indexes тохируулах

### Step 6: File Upload солих
- Firebase Storage ашиглах
- Upload functions бичих

---

## 🔐 Security Best Practices

1. **Firestore Security Rules** - бичих шаардлагатай
2. **Storage Rules** - бичих шаардлагатай
3. **Environment Variables** - `.env` файлыг GitHub-д оруулахгүй
4. **API Keys** - Client-side дээр public байгаа нь normal (Firebase-д)

---

## 📝 Checklist

- [ ] Firebase project үүсгэх
- [ ] Firebase Auth идэвхжүүлэх
- [ ] Firestore database үүсгэх
- [ ] Firebase Storage идэвхжүүлэх
- [ ] Firebase config авах
- [ ] `firebase` package суулгах
- [ ] `.env` файл үүсгэх
- [ ] Vercel account үүсгэх
- [ ] Vercel дээр project deploy хийх
- [ ] Environment variables Vercel дээр тохируулах
- [ ] Custom domain тохируулах (optional)

---

## 🆘 Тусламж

- **Firebase Docs**: https://firebase.google.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Firebase + React**: https://firebase.google.com/docs/web/setup
- **Vercel Serverless Functions**: https://vercel.com/docs/functions

---

## 🎯 Recommendation

**Эхлэх дараалал:**
1. ✅ Firebase project тохируулах (энэ заавар)
2. ✅ Vercel дээр deploy хийх (frontend л байгаа эхлээд)
3. ✅ Firebase config файл үүсгэх
4. ✅ Authentication migration хийх
5. ✅ Backend API үүсгэх (Vercel Functions)
6. ✅ Database migration хийх

---

## ⚡ Quick Start Commands

```bash
# 1. Firebase суулгах
npm install firebase axios

# 2. Vercel CLI суулгах (optional)
npm install -g vercel

# 3. Deploy хийх
vercel

# 4. Production deploy
vercel --prod
```

