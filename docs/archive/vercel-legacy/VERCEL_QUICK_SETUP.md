# Vercel Quick Setup Guide - zarmongolia.com

## 🚀 Шууд Deploy хийх заавар

### Option 1: Vercel Dashboard (Web UI) ⭐ Хамгийн хялбар

#### Step 1: Vercel Account үүсгэх
1. https://vercel.com руу орох
2. **"Sign Up"** button дарах
3. **GitHub** account-аараа sign up хийх (хялбар)
4. Vercel-д GitHub access өгөх

#### Step 2: Project Import хийх
1. Vercel Dashboard → **"Add New..."** → **"Project"**
2. **"Import Git Repository"** дээр дарах
3. GitHub repository сонгох:
   - Хэрэв repository байгаа бол: сонгох
   - Хэрэв байхгүй бол: GitHub дээр repository үүсгэх (доорх Step 3 харна уу)
4. **"Import"** button дарах

#### Step 3: Project Settings тохируулах
1. **Framework Preset:** `Vite` (automatic detect хийж болно)
2. **Root Directory:** `.` (root) эсвэл `zar-746103b7` (хэрэв repo root дээр байгаа бол)
3. **Build Command:** `npm run build` (automatic)
4. **Output Directory:** `dist` (automatic)
5. **Install Command:** `npm install` (automatic)

#### Step 4: Environment Variables нэмэх

**Vercel Dashboard** → **Settings** → **Environment Variables**:

Дараах variables нэмэх (Firebase config):

```
VITE_FIREBASE_API_KEY=AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=384960850116
VITE_FIREBASE_APP_ID=1:384960850116:web:7bfcf963b92dace3b24191
```

**Environment сонгох:**
- ✅ Production
- ✅ Preview  
- ✅ Development

#### Step 5: Deploy хийх
1. **"Deploy"** button дарах
2. Deployment хийгдэхийг хүлээх (1-2 минут)
3. ✅ **Success!** → URL авна (жишээ: `koreazar-abc123.vercel.app`)

#### Step 6: Custom Domain нэмэх (zarmongolia.com)
1. Vercel Dashboard → **Project** → **Settings** → **Domains**
2. **"Add Domain"** button дарах
3. Domain оруулах: `zarmongolia.com`
4. Vercel DNS records өгнө:
   - `A` record эсвэл `CNAME` record
5. Cloudflare дээр DNS records нэмэх (`CLOUDFLARE_VERCEL_DNS.md` харна уу)

---

### Option 2: Vercel CLI (Terminal)

#### Step 1: Vercel CLI суулгах
```bash
npm install -g vercel
```

#### Step 2: Login хийх
```bash
vercel login
```
- Browser нээгдэж, Vercel account-аараа login хийх

#### Step 3: Project folder руу орох
```bash
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7
```

#### Step 4: Environment variables тохируулах
`.env` файл үүсгэх эсвэл Vercel Dashboard дээр нэмэх:

```bash
# .env файл үүсгэх (local development-д л хэрэгтэй)
# Vercel дээр Dashboard-аар нэмэх нь илүү сайн
```

#### Step 5: Deploy хийх
```bash
# Preview deploy (test)
vercel

# Production deploy
vercel --prod
```

---

### Option 3: GitHub Repository үүсгэх (хэрэв байхгүй бол)

#### Step 1: GitHub дээр repository үүсгэх
1. https://github.com руу нэвтрэх
2. **"New repository"** button дарах
3. Repository name: `koreazar` эсвэл `zarmongolia`
4. **Public** эсвэл **Private** сонгох
5. **"Create repository"** button дарах

#### Step 2: Local code GitHub-д push хийх
```bash
# Project folder руу орох
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# Git initialize (хэрэв хийгээгүй бол)
git init

# .gitignore файл шалгах (.env файл ignore хийгдсэн эсэх)

# All files нэмэх
git add .

# Commit хийх
git commit -m "Initial commit - Koreazar app"

# GitHub remote нэмэх (repository URL-ийг өөрийнхөөр солих)
git remote add origin https://github.com/YOUR_USERNAME/koreazar.git

# Push хийх
git push -u origin main
```

#### Step 3: Vercel дээр import хийх
- Option 1-ийн Step 2-оос үргэлжлүүлнэ

---

## 📋 Checklist

### Before Deploy:
- [ ] Vercel account үүсгэсэн
- [ ] GitHub repository байгаа эсэхийг шалгасан
- [ ] Local code GitHub-д push хийсэн (хэрэв байхгүй бол)
- [ ] Firebase config мэдэгдэж байгаа

### During Deploy:
- [ ] Vercel Dashboard дээр project import хийсэн
- [ ] Framework: Vite сонгосон
- [ ] Root Directory зөв сонгосон
- [ ] Environment Variables нэмсэн (6 ш)
- [ ] Deploy button дарахад алдаа гарсангүй

### After Deploy:
- [ ] Deployment амжилттай болсон
- [ ] URL аваад browser дээр нээсэн
- [ ] Login/Register ажиллаж байгааг шалгасан
- [ ] Custom domain (`zarmongolia.com`) нэмсэн
- [ ] Cloudflare DNS records тохируулсан

---

## 🔧 Troubleshooting

### Алдаа: "Build failed"
**Шалгах:**
1. Environment variables бүгдийг нэмсэн эсэх
2. `package.json` дээр `build` script байгаа эсэх
3. Vercel build logs шалгах (Deployment → Logs)

### Алдаа: "Module not found"
**Шалгах:**
1. `node_modules` `.gitignore` дээр байгаа эсэх
2. `package.json` дээр dependencies зөв эсэх

### Алдаа: "Environment variable not found"
**Шалгах:**
1. Vercel Dashboard → Settings → Environment Variables
2. Бүх Firebase config variables нэмсэн эсэх
3. Environment (Production/Preview/Development) зөв сонгосон эсэх

---

## 🎯 Quick Start Commands

```bash
# 1. Vercel CLI суулгах
npm install -g vercel

# 2. Login хийх
vercel login

# 3. Project folder руу орох
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# 4. Deploy хийх
vercel --prod
```

---

## 📚 Дараах алхмууд

1. ✅ Vercel дээр deploy хийх
2. ✅ Free domain авах (`project-name.vercel.app`)
3. ✅ Custom domain нэмэх (`zarmongolia.com`)
4. ✅ Cloudflare DNS тохируулах
5. ✅ SSL certificate хүлээх (автоматаар)

---

## 🔗 Холбоосууд

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Vercel CLI Docs:** https://vercel.com/docs/cli

