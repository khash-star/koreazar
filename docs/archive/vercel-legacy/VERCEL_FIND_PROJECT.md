# Vercel Project Олох - Заавар

## 🎯 Зорилго
Vercel дээр `zarkorea.com` domain-тай project олох

## 📋 Арга 1: Vercel CLI (Command Line)

### 1. Vercel Login
```powershell
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7
vercel login
```
- Browser нээгдэх болно
- Vercel account-аар нэвтрэх
- "Authorize Vercel" дарах

### 2. Projects List харах
```powershell
vercel projects ls
```

### 3. Project Link хийх (хэрэв шаардлагатай)
```powershell
vercel link
```
- Project сонгох
- Directory confirm хийх

### 4. Environment Variable нэмэх
```powershell
vercel env add VITE_OPENAI_API_KEY
```
- Value оруулах: `sk-your-actual-api-key-here` (OpenAI dashboard-аас авсан API key оруулах)
- Environment сонгох: Production, Preview, Development (бүгдийг)

---

## 📋 Арга 2: Vercel Dashboard (Web)

### 1. Vercel Dashboard руу орох
- https://vercel.com/dashboard

### 2. Projects хэсэг рүү орох
- Зүүн цэснээс **Projects** сонгох

### 3. Project олох
Хайх:
- `koreazar`
- `zarkorea`
- `base44-app`
- `zar-746103b7`

Эсвэл domain-аар:
- `zarkorea.com` domain-тай project хайх

### 4. Project сонгох
- Project дээр дарах
- Project хуудас руу орох

### 5. Settings → Environment Variables
- **Settings** tab
- **Environment Variables** хэсэг
- **Add New** товчлуур

### 6. Variable нэмэх
- **Name**: `VITE_OPENAI_API_KEY`
- **Value**: `sk-your-actual-api-key-here` (OpenAI dashboard-аас авсан API key оруулах)
- **Environment**: Production, Preview, Development (бүгдийг)
- **Save**

### 7. Redeploy
- **Deployments** tab
- Latest deployment → **⋯** → **Redeploy**

---

## 🔍 Project олох хурдан арга

### GitHub Repository-аар:
1. GitHub дээр `koreazar` repository-г нээх
2. **Settings** → **Pages** эсвэл **Deployments** хэсэг шалгах
3. Vercel link байгаа эсэхийг шалгах

### Domain-аар:
1. Vercel Dashboard → **Domains**
2. `zarkorea.com` domain хайх
3. Domain-тай холбоотой project харах

---

## ✅ Шалгах

### Browser:
- `https://zarkorea.com/aibot` нээх
- AI bot ажиллаж байгаа эсэхийг шалгах

### Vercel Logs:
- Project → Deployments → Latest → View Function Logs
- Environment variable уншсан эсэхийг шалгах

---

**Амжилт хүсье!** 🚀

