# Vercel дээр Deploy хийх заавар

## 🔧 Vercel дээр Deploy хийх арга:

### Арга 1: Vercel CLI ашиглах (Хамгийн хурдан)

1. **Vercel CLI суулгах:**
   ```bash
   npm install -g vercel
   ```

2. **Vercel дээр нэвтрэх:**
   ```bash
   vercel login
   ```

3. **Project-ийг deploy хийх:**
   ```bash
   cd zar-746103b7
   vercel
   ```
   
   Эхний удаа асуух асуултууд:
   - `Set up and deploy?` → **Y**
   - `Which scope?` → Таны account сонгох
   - `Link to existing project?` → **N** (шинэ project)
   - `What's your project's name?` → `koreazar` эсвэл хүссэн нэр
   - `In which directory is your code located?` → `./` (current directory)
   - `Want to override the settings?` → **N**

4. **Production deploy хийх:**
   ```bash
   vercel --prod
   ```

### Арга 2: Vercel Website дээр (GUI)

1. **Vercel website руу орох:**
   - https://vercel.com
   - GitHub account-аараа нэвтрэх

2. **New Project үүсгэх:**
   - "Add New..." → "Project" дарна
   - GitHub repository сонгох (`khash-star/koreazar`)
   - Project settings:
     - **Framework Preset:** Vite
     - **Root Directory:** `zar-746103b7`
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

3. **Environment Variables нэмэх:**
   - Settings → Environment Variables
   - Дараах variables нэмэх (.env файл дээрх утгуудыг ашиглах):
     ```
     VITE_FIREBASE_API_KEY=your_firebase_api_key
     VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
     VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
     VITE_FIREBASE_MESSAGING_SENDER_ID=384960850116
     VITE_FIREBASE_APP_ID=1:384960850116:web:7bfcf963b92dace3b24191
     VITE_OPENAI_API_KEY=your_openai_api_key
     ```
   - ⚠️ **Анхаар:** `.env` файл дээрх жинхэнэ API keys-ийг Vercel дээр оруулах хэрэгтэй

4. **Deploy хийх:**
   - "Deploy" button дарна

### Арга 3: GitHub Integration (Автомат Deploy)

1. **Vercel дээр GitHub-тай холбох:**
   - Vercel → Settings → Git
   - GitHub repository-г connect хийх

2. **Автомат Deploy:**
   - `main` branch дээр push хийх бүрт автоматаар deploy хийгдэнэ
   - Pull Request үүсгэхэд Preview deploy хийгдэнэ

## ⚙️ Vercel Configuration (vercel.json)

`vercel.json` файл аль хэдийн үүсгэгдсэн байна. Энэ нь:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing-ийн хувьд бүх route-ууд `index.html` руу чиглүүлнэ

## 🔄 Deploy хийсний дараа:

1. **Domain тохируулах:**
   - Vercel → Project → Settings → Domains
   - `zarkorea.com` domain нэмэх
   - DNS records тохируулах (Vercel-ийн зааварчилгаа дагах)

2. **Environment Variables шалгах:**
   - Бүх Firebase болон OpenAI API keys зөв оруулсан эсэхийг шалгах

3. **Build Log шалгах:**
   - Deploy хийсний дараа Build Log шалгах
   - Алдаа байвал засах

## 📝 Тайлбар:

- **Build Command:** `npm run build` - Vite build хийх
- **Output Directory:** `dist` - Build хийгдсэн файлууд энд байрлана
- **Framework:** Vite - React app-ийн framework
- **Rewrites:** SPA routing-ийн хувьд бүх route-ууд `index.html` руу чиглүүлнэ

## ✅ Deploy хийсний дараа шалгах:

1. Website ажиллаж байгаа эсэх
2. CSS файлууд зөв load хийгдэж байгаа эсэх
3. Firebase connection зөв ажиллаж байгаа эсэх
4. Authentication ажиллаж байгаа эсэх

## ⚠️ Чухал:

- Environment Variables-ийг `.env` файл дээрх жинхэнэ утгуудаар солих хэрэгтэй
- API keys-ийг GitHub дээр push хийхгүй байх (security)
- Vercel дээр Environment Variables нэмэхдээ Production, Preview, Development гэсэн 3 environment байна
