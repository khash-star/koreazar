# Domain Setup Guide - Koreazar App

## 🎯 Domain сонголтууд

### 1. **Vercel Free Domain (Хамгийн хялбар)** ⭐ Рекомендлэсэн

**Үнэ:** Үнэгүй

**Ашиглах:**
- Vercel дээр deploy хийхэд автоматаар free domain өгдөг
- Format: `your-project-name.vercel.app`
- Жишээ: `koreazar.vercel.app` эсвэл `koreazar-khash.vercel.app`

**Давуу тал:**
- ✅ Үнэгүй
- ✅ SSL certificate автоматаар (HTTPS)
- ✅ Хурдан нарийвчлал (CDN)
- ✅ DNS тохиргоо хэрэггүй

**Алдаа:**
- Custom domain биш (`.vercel.app` extension)

**Хэрэглэх:**
```bash
# Vercel дээр deploy хийх
vercel --prod

# Эсвэл GitHub-тай холбох → автоматаар deploy
```

---

### 2. **Namecheap** (Хамгийн хямд)

**Үнэ:** ~$8-12/жил (.com domain)

**Вэбсайт:** https://www.namecheap.com

**Давуу тал:**
- ✅ Хямд үнэ
- ✅ Хялбар удирдлага
- ✅ Монгол картаар төлөх боломжтой (PayPal)
- ✅ DNS удирдлага сайтай

**Алдаа:**
- Renewal үнэ ихсэж болно

**Хэрэглэх:**
1. Namecheap руу бүртгүүлэх
2. Domain хайх (жишээ: `koreazar.com`)
3. Сагсанд нэмэх, төлбөр төлөх
4. Vercel дээр custom domain тохируулах

---

### 3. **Cloudflare** (Хамгийн сайн үнэ/чанар)

**Үнэ:** Registrar үнэ л (domain үнэ + 0% markup)

**Вэбсайт:** https://www.cloudflare.com/products/registrar/

**Давуу тал:**
- ✅ Хамгийн хямд (domain үнэ л, markup байхгүй)
- ✅ Free DNS + CDN
- ✅ SSL certificate үнэгүй
- ✅ Security features

**Алдаа:**
- Бүртгэл нь бусдынхтай харьцуулахад илүү төвөгтэй

---

### 4. **Google Domains** (Одоо Squarespace)

**Үнэ:** ~$12/жил

**Вэбсайт:** https://domains.google (одоо Squarespace-д шилжсэн)

**Давуу тал:**
- ✅ Хялбар интерфейс
- ✅ Google account-тай холбогдоно

**Алдаа:**
- Squarespace-д шилжсэн (шинэ бүртгэл)

---

### 5. **GoDaddy** (Хамгийн алдартай)

**Үнэ:** ~$12-15/жил (first year хямд, дараа нь үнэ ихсэнэ)

**Вэбсайт:** https://www.godaddy.com

**Давуу тал:**
- ✅ Алдартай, найдвартай
- ✅ Бүртгэл хялбар

**Алдаа:**
- ⚠️ First year хямд, renewal үнэ ихсэж болно
- ⚠️ Нэмэлт үйлчилгээ санал болгодог

---

## 🚀 Рекомендлэсэн: Vercel Free Domain + Namecheap (Optional)

### Step 1: Vercel Free Domain ашиглах (Одоо)

1. **Vercel дээр deploy хийх:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Автоматаар domain авах:**
   - Vercel dashboard → Project → Settings → Domains
   - Free domain: `koreazar-xxxxx.vercel.app`

3. **Шалгах:**
   - Browser дээр `https://your-project.vercel.app` нээх

### Step 2: Custom Domain нэмэх (Дараа нь, optional)

Хэрэв custom domain хүсвэл:

1. **Namecheap-аас domain худалдаж авах:**
   - https://www.namecheap.com
   - Хайх: `koreazar.com` эсвэл `koreazar.mn`
   - Сагсанд нэмэх, төлбөр төлөх

2. **Vercel дээр domain тохируулах:**
   - Vercel Dashboard → Project → Settings → Domains
   - "Add" button дарах
   - Domain оруулах: `koreazar.com`
   - DNS records Vercel өгнө

3. **Namecheap дээр DNS тохируулах:**
   - Namecheap → Domain List → Manage
   - Advanced DNS → Add New Record
   - Vercel-ийн өгсөн records-уудыг нэмэх

---

## 💰 Үнэ харьцуулалт (.com domain, 1 жил):

| Provider | First Year | Renewal | Free Domain |
|----------|-----------|---------|-------------|
| **Vercel** | Үнэгүй | Үнэгүй | ✅ .vercel.app |
| **Namecheap** | ~$9 | ~$12 | ❌ |
| **Cloudflare** | ~$8 | ~$8 | ❌ |
| **GoDaddy** | ~$2 (promo) | ~$15 | ❌ |

---

## 🎯 Зөвлөмж

### Одоо (Development/Testing):
**Vercel free domain ашиглах**
- `koreazar.vercel.app` эсвэл иймэрхүү
- Үнэгүй, хурдан тохируулах
- Production-д ч ашиглаж болно

### Дараа нь (Production):
**Namecheap эсвэл Cloudflare-аас domain худалдаж авах**
- Professional харагдах: `koreazar.com`
- Custom domain тохируулах (~30 минут)
- Vercel-д custom domain нэмэх

---

## 📋 Vercel Domain Setup (Quick Guide)

### 1. Deploy to Vercel:
```bash
# GitHub repository үүсгэх
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/koreazar.git
git push -u origin main

# Vercel дээр GitHub-тай холбох
# https://vercel.com → Import Project → GitHub repository сонгох
```

### 2. Automatic Domain:
- Vercel автоматаар `project-name.vercel.app` domain өгнө
- SSL автоматаар идэвхжинэ
- Дараагийн deploy-үүд автоматаар update хийгдэнэ

### 3. Custom Domain (Optional):
- Settings → Domains → Add Domain
- Domain оруулах
- DNS records-ийг дагах

---

## ✅ Checklist

- [ ] Vercel account үүсгэх (free)
- [ ] GitHub repository үүсгэх
- [ ] Vercel дээр project import хийх
- [ ] Free domain авах (automatic)
- [ ] (Optional) Namecheap-аас custom domain худалдаж авах
- [ ] (Optional) Custom domain Vercel дээр тохируулах

---

## 🔗 Холбоосууд

- **Vercel:** https://vercel.com
- **Namecheap:** https://www.namecheap.com
- **Cloudflare:** https://www.cloudflare.com/products/registrar/
- **GoDaddy:** https://www.godaddy.com

---

## 💡 Зөвлөмж

**Одоогийн байдлаар Vercel free domain-ээр эхлээд, дараа нь custom domain нэмэх нь хамгийн хялбар арга байна.**

