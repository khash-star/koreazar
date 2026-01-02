# Vercel GitHub Connection Fix - Сайт Update Хийгдэхгүй Асуудал

## 🔍 Асуудал
Vercel дээр сайт update хийгдэхгүй байна. GitHub push хийсэн ч Vercel дээр automatic deployment хийгдэхгүй байна.

## ✅ Шалгах зүйлс

### 1. Vercel Dashboard дээр GitHub Connection шалгах

1. **Vercel Dashboard руу оч:**
   - https://vercel.com/dashboard
   - Login хийх

2. **Project Settings шалгах:**
   - Project сонгох
   - Settings → Git
   - GitHub repository холбогдсон эсэхийг шалгах

3. **Хэрэв холбогдоогүй бол:**
   - "Connect Git Repository" дарах
   - GitHub repository сонгох: `khash-star/koreazar`
   - "Import" дарах

### 2. Build and Deployment Settings шалгах (ВАЖНО!)

1. **Settings → Build and Deployment руу оч**
2. **Production Branch шалгах:**
   - Production Branch: `main` байх ёстой
   - Хэрэв буруу бол: `main` сонгох

3. **Build Settings шалгах:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Ignored Build Step шалгах:**
   - Behavior: "Automatic" байх ёстой
   - Хэрэв custom command байгаа бол: "Automatic" руу солих

### 3. General Settings шалгах (Root Directory - ВАЖНО!)

1. **Settings → General руу оч**
2. **Root Directory шалгах:**
   - Root Directory: `zar-746103b7` байх ёстой (важно!)
   - Хэрэв `.` эсвэл хоосон байвал: `zar-746103b7` гэж өөрчлөх
   - "Save" button дарах

3. **Framework Preset шалгах:**
   - Framework Preset: **Vite** байх ёстой

### 4. Environment Variables шалгах

1. **Settings → Environment Variables руу оч**
2. **Дараах variables байгаа эсэхийг шалгах:**
   ```
   VITE_FIREBASE_API_KEY
   VERCEL_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

3. **Хэрэв дутуу бол нэмэх:**
   - Firebase config-аас утгуудыг авах
   - Environment сонгох: Production, Preview, Development (бүгдийг нь)

### 5. GitHub Webhook шалгах

1. **GitHub Repository руу оч:**
   - https://github.com/khash-star/koreazar
   - Settings → Webhooks

2. **Vercel webhook байгаа эсэхийг шалгах:**
   - `vercel.com` эсвэл `vercel.app` domain-тай webhook байх ёстой

3. **Хэрэв байхгүй бол:**
   - Vercel Dashboard → Project → Settings → Git
   - "Reconnect" эсвэл "Disconnect and reconnect" дарах

## 🔍 Deployment Logs шалгах

1. **Vercel Dashboard → Deployments tab руу оч**
2. **Хамгийн сүүлийн deployment-ийг шалгах:**
   - Status: ✅ Ready эсвэл ❌ Error
   - Хэрэв Error байвал: "View Function Logs" эсвэл "View Build Logs" дарах
   - Build алдаа байгаа эсэхийг харах

3. **Build алдаа байвал:**
   - Environment variables дутуу эсэх
   - Build command буруу эсэх
   - Root directory буруу эсэх

## 🔧 Manual Deploy хийх (Түр шийдэл)

Хэрэв automatic deployment ажиллахгүй байвал manual deploy хийх:

### Арга 1: Vercel Dashboard

1. Vercel Dashboard → Project
2. "Deployments" tab руу оч
3. "Redeploy" button дарах
4. "Use existing Build Cache" checkbox-ийг арилгах
5. "Redeploy" дарах

### Арга 2: Vercel CLI

```bash
# Vercel CLI суулгах (хэрэв байхгүй бол)
npm install -g vercel

# Login хийх
vercel login

# Project folder руу орох
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# Production deploy хийх
vercel --prod
```

## 🐛 Түгээмэл асуудлууд

### Асуудал 1: Root Directory буруу
**Шалтгаан:** Root Directory `zar-746103b7` биш байна
**Шийдэл:** Settings → General → Root Directory → `zar-746103b7` гэж тохируулах

### Асуудал 2: Build алдаа
**Шалтгаан:** Environment variables дутуу эсвэл буруу
**Шийдэл:** Settings → Environment Variables → Бүх Firebase config нэмэх

### Асуудал 3: GitHub webhook ажиллахгүй
**Шалтгаан:** GitHub-тай холбогдоогүй эсвэл webhook устгагдсан
**Шийдэл:** Settings → Git → "Reconnect" дарах

### Асуудал 4: Branch буруу
**Шалтгаан:** Production Branch `main` биш байна
**Шийдэл:** Settings → Git → Production Branch → `main` сонгох

## ✅ Шалгах Checklist

- [x] Vercel Dashboard дээр project байгаа
- [x] GitHub repository холбогдсон (`khash-star/koreazar`)
- [ ] **Settings → General → Root Directory: `zar-746103b7`** (важно!)
- [ ] **Settings → Build and Deployment → Production Branch: `main`**
- [ ] **Settings → Build and Deployment → Build Command: `npm run build`**
- [ ] **Settings → Build and Deployment → Output Directory: `dist`**
- [ ] **Settings → Git → Automatic Deployments: Enabled** (хэрэв байгаа бол)
- [ ] Environment Variables бүгд нэмэгдсэн
- [ ] **Deployments tab → Latest deployment → Logs шалгах** (build алдаа байгаа эсэх)

## 📞 Тусламж

Хэрэв дээрх бүх зүйл зөв байгаа ч ажиллахгүй байвал:
1. Vercel Dashboard → Project → Deployments → Latest deployment → Logs шалгах
2. Build алдаа байгаа эсэхийг харах
3. Vercel support-д хандах

