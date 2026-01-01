# Vercel Build Error Fix

## ⚠️ Алдаа: "vite: command not found"

**Алдааны шалтгаан:**
- Build command буруу тохируулагдсан
- Dependencies суусангүй

## ✅ ШИЙДЭЛ:

### Vercel Dashboard дээр тохируулах:

1. **Vercel Dashboard** → **Project** → **Settings** → **General**
2. **Build & Development Settings** section олох
3. Дараах settings шалгах:

**Build Command:**
```
npm run build
```
(❌ `vite build` биш!)

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

**Development Command:**
```
npm run dev
```

### Эсвэл vercel.json файл ашиглах:

`vercel.json` файл аль хэдийн үүсгэгдсэн байна. Vercel автоматаар энийг уншина.

---

## 🔧 Засах алхмууд:

### Option 1: Vercel Dashboard (Хамгийн хурдан)

1. **Vercel Dashboard** → **Project** → **Settings** → **General**
2. **Build & Development Settings** section
3. **Build Command** field-д: `npm run build` гэж бичнэ (биш `vite build`)
4. **Save** button дарах
5. **Deployments** → **Redeploy** эсвэл дахин deploy хийх

### Option 2: vercel.json файл

`vercel.json` файл аль хэдийн үүсгэгдсэн, гэхдээ Vercel дээр settings override хийж болно.

---

## ✅ Шалгах:

1. Settings → General → Build Command: `npm run build` байгаа эсэх
2. Settings → General → Output Directory: `dist` байгаа эсэх
3. Dependencies: `package.json` дээр `vite` package байгаа эсэх

---

## 🔄 Дахин Deploy хийх:

1. Vercel Dashboard → **Deployments**
2. Latest deployment → **"..."** menu → **"Redeploy"**
3. Эсвэл **Settings** → **General** → Settings засаад **"Redeploy"**

---

## 📋 Checklist:

- [ ] Build Command: `npm run build` (❌ `vite build` биш)
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] `package.json` дээр `vite` package байгаа
- [ ] Environment Variables бүгд нэмэгдсэн
- [ ] Deployments → Redeploy хийсэн

