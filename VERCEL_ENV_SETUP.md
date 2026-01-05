# Vercel Environment Variable Тохируулга

## 🎯 Зорилго
Vercel дээр `VITE_OPENAI_API_KEY` environment variable тохируулах

## 📋 Алхам алхмаар заавар

### 1. Vercel Dashboard руу нэвтрэх
1. **Vercel website** руу орох: https://vercel.com/
2. **Sign in** хийх
3. **Dashboard** руу орох

### 2. Project сонгох
1. **Projects** хэсэг рүү орох
2. **koreazar** эсвэл **zar-746103b7** project сонгох
3. Project хуудас руу орох

### 3. Environment Variables нэмэх
1. **Settings** tab дээр дарах
2. Зүүн цэснээс **Environment Variables** сонгох
3. **Add New** товчлуур дээр дарах

### 4. Variable мэдээлэл оруулах
Дараах мэдээллийг оруулах:

- **Name**: `VITE_OPENAI_API_KEY`
- **Value**: `sk-your-actual-api-key-here` (OpenAI dashboard-аас авсан API key оруулах)
- **Environment**: 
  - ✅ **Production**
  - ✅ **Preview**
  - ✅ **Development**

### 5. Save хийх
1. **Save** товчлуур дээр дарах
2. Variable харагдах ёстой

### 6. Redeploy хийх
1. **Deployments** tab руу орох
2. Хамгийн сүүлийн deployment-ийг олох
3. **⋯** (three dots) дээр дарах
4. **Redeploy** сонгох
5. **Redeploy** товчлуур дээр дарах

---

## 🔍 Шалгах

### Browser дээр:
1. `https://zarkorea.com/aibot` нээх
2. AI bot ажиллаж байгаа эсэхийг шалгах
3. "OpenAI API key is not configured" алдаа гарч байгаа эсэхийг шалгах

### Vercel Logs:
1. **Deployments** → Latest deployment → **View Function Logs**
2. Environment variable уншсан эсэхийг шалгах

---

## ⚠️ Анхаарах зүйлс

1. **Environment сонгох**: Production, Preview, Development гурвыг нь сонгох
2. **Redeploy хийх**: Environment variable нэмсний дараа заавал redeploy хийх
3. **API key аюулгүй байдал**: API key-г хэнд ч хуваалцахгүй байх

---

## 🐛 Асуудал Шидвэрлэх

### Environment variable харагдахгүй байвал:
- ✅ Variable нэр зөв эсэх (`VITE_OPENAI_API_KEY`)
- ✅ Save хийсэн эсэх
- ✅ Redeploy хийсэн эсэх

### Алдаа гарсаар байвал:
- ✅ Browser cache цэвэрлэх (Ctrl+Shift+R)
- ✅ Vercel logs шалгах
- ✅ Environment variable дахин шалгах

---

## 📸 Screenshot заавар

### Step 1: Settings
```
Project → Settings → Environment Variables
```

### Step 2: Add Variable
```
Name: VITE_OPENAI_API_KEY
Value: sk-proj-...
Environment: ☑ Production ☑ Preview ☑ Development
```

### Step 3: Redeploy
```
Deployments → Latest → ⋯ → Redeploy
```

---

**Амжилт хүсье!** 🚀
