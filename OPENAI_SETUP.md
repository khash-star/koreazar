# OpenAI API Key Тохируулга

## 🔴 Алдаа
```
OpenAI API key is not configured
```

## ✅ Шийдэл

### 1. OpenAI API Key Авах

1. **OpenAI website руу орох**: https://platform.openai.com/
2. **Нэвтрэх** эсвэл **бүртгүүлэх**
3. **API Keys** хэсэг рүү орох:
   - https://platform.openai.com/api-keys
4. **"Create new secret key"** дарах
5. **Key нэрийг** оруулах (жишээ: "zarkorea-bot")
6. **Key-г copy хийх** (дараа дахин харагдахгүй!)

---

### 2. Local Development (.env файл)

#### Windows PowerShell:
```powershell
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# .env файл үүсгэх эсвэл засах
@"
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
"@ | Out-File -Encoding utf8 .env
```

#### Manual:
1. `zar-746103b7` folder дотор `.env` файл үүсгэх (эсвэл засах)
2. Энэ мөрийг нэмэх:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. `sk-your-actual-api-key-here`-ийг бодит API key-аар солих
4. Save

---

### 3. Vercel Deploy (Production)

#### Vercel дээр Environment Variable нэмэх:

1. **Vercel Dashboard** руу орох: https://vercel.com/dashboard
2. **Project** сонгох (zarkorea эсвэл zar-746103b7)
3. **Settings** → **Environment Variables**
4. **Add New**:
   - **Name**: `VITE_OPENAI_API_KEY`
   - **Value**: `sk-your-actual-api-key-here`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
5. **Save**
6. **Redeploy** хийх:
   - **Deployments** → Latest deployment → **Redeploy**

---

### 4. cPanel Deploy (Alternative)

Хэрэв cPanel ашиглаж байвал:

#### Арга 1: .env файл upload хийх
1. cPanel → **File Manager**
2. Project folder руу орох
3. `.env` файл upload хийх (эсвэл create хийх)
4. Edit хийж `VITE_OPENAI_API_KEY` нэмэх

#### Арга 2: Build-ийн дараа environment variable тохируулах
```bash
# Build хийхээсээ өмнө .env файлд API key нэмэх
npm run build

# Build файлуудыг cPanel руу upload хийх
```

**Анхаар**: Vite build хийхдээ `.env` файлын `VITE_` prefix-тэй variable-ууд build-д ороно.

---

### 5. Шалгах

#### Local Development:
```bash
# .env файл байгаа эсэхийг шалгах
cat .env
# эсвэл Windows дээр
type .env

# Dev server эхлүүлэх
npm run dev

# Browser дээр https://localhost:5173/aibot нээх
```

#### Production:
1. `https://zarkorea.com/aibot` нээх
2. AI bot ажиллаж байгаа эсэхийг шалгах
3. Алдаа гарвал browser console (F12) шалгах

---

### 6. Асуудал Шидвэрлэх

#### Алдаа: "OpenAI API key is not configured"
**Шалгах**:
- ✅ `.env` файл байгаа эсэх
- ✅ `VITE_OPENAI_API_KEY` variable байгаа эсэх
- ✅ API key зөв copy хийсэн эсэх (space, newline байхгүй)
- ✅ Dev server restart хийсэн эсэх
- ✅ Vercel дээр environment variable тохируулсан эсэх
- ✅ Vercel redeploy хийсэн эсэх

#### Алдаа: "Invalid API key"
**Шалгах**:
- ✅ API key зөв copy хийсэн эсэх
- ✅ API key идэвхтэй эсэх (OpenAI dashboard-аас шалгах)
- ✅ Account-д төлбөр төлөгдсөн эсэх (free tier $5 credit байна)

#### Алдаа: "Rate limit exceeded"
**Шийдэл**:
- Rate limiting тохируулах
- Retry logic нэмэх
- Usage monitoring хийх

---

## 🔒 Аюулгүй Байдал

### ⚠️ Анхаарах зүйлс:

1. **API key-г хэнд ч хуваалцахгүй байх**
2. **GitHub дээр commit хийхгүй байх** (.gitignore-д байгаа эсэхийг шалгах)
3. **Production-д environment variables ашиглах**
4. **Rate limiting тохируулах** (хэт их хэрэглээснээс сэргийлэх)

### .gitignore шалгах:
```gitignore
# .env файлууд
.env
.env.local
.env.production
.env.development

# API keys
*.key
*.pem
```

---

## 💰 Үнэ

### OpenAI Pricing:
- **GPT-4o-mini** (одоо ашиглаж байгаа): ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-3.5-turbo**: ~$0.50 per 1M tokens (илүү хямд)
- **GPT-4**: ~$30 per 1M tokens (илүү үнэтэй)
- **Free tier**: $5 credit (шинэ хэрэглэгчдэд)

### Хэмнэх арга:
1. **Rate limiting** тохируулах (одоо 20 requests/day)
2. **Cache** ашиглах (ижил асуултууд)
3. **GPT-4o-mini** ашиглах (GPT-4-ээс хямд, одоо ашиглаж байна)

---

## 📝 Code Location

- **AI Service**: `src/services/aiService.js`
- **AI Bot Page**: `src/pages/AIBot.jsx`
- **Environment Variable**: `VITE_OPENAI_API_KEY`

---

## ✅ Шалгах Жагсаалт

- [ ] OpenAI API key авсан
- [ ] `.env` файлд `VITE_OPENAI_API_KEY` нэмсэн
- [ ] Vercel environment variables тохируулсан (production)
- [ ] Vercel redeploy хийсэн
- [ ] AI bot тест хийсэн
- [ ] Алдаа шийдэгдсэн

**Амжилт хүсье!** 🚀

