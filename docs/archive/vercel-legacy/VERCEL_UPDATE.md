# 🔄 Vercel дээр Project Update хийх

## ✅ Одоогийн байдал:

Vercel дээр **koreazar** project аль хэдийн байна:
- **Domain:** zarkorea.com, www.zarkorea.com
- **Status:** Ready
- **Source:** main branch
- **Auto Deploy:** Идэвхтэй (main branch дээр push хийх бүрт автоматаар deploy)

## 🔄 Update хийх арга:

### Арга 1: Автомат Deploy (Хамгийн хялбар)

1. **GitHub дээр push хийх:**
   ```bash
   git push
   ```
   
2. **Vercel автоматаар deploy хийгдэнэ:**
   - Vercel → Project → Deployments дээр харагдана
   - Build хийгдэх хүлээх (2-3 минут)
   - Deploy амжилттай бол Production deployment шинэчлэгдэнэ

### Арга 2: Manual Deploy (Vercel Dashboard)

1. **Vercel → Project → Deployments**
2. **"Redeploy"** button дарна
3. **"Redeploy"** confirm хийх

## ⚙️ Environment Variables шалгах:

Vercel → Project → Settings → Environment Variables дээр дараах variables байгаа эсэхийг шалгах:

✅ **Шалгах:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_OPENAI_API_KEY`

⚠️ **Хэрэв байхгүй бол:**
- Settings → Environment Variables → "Add New"
- Дээрх 7 variables нэмэх
- Production, Preview, Development гэсэн 3 environment дээр нэмэх

## 🔍 Deploy хийсний дараа шалгах:

1. ✅ Website ажиллаж байгаа эсэх
2. ✅ CSS файлууд зөв load хийгдэж байгаа эсэх (MIME type алдаа байхгүй эсэх)
3. ✅ Firebase connection зөв ажиллаж байгаа эсэх
4. ✅ Authentication ажиллаж байгаа эсэх

## 📝 Тайлбар:

- **Root Directory:** `zar-746103b7` (Vercel дээр тохируулагдсан байх ёстой)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `dist` (default)
- **vercel.json:** Security headers болон CSP тохируулагдсан

## 🚀 Одоо хийх зүйл:

1. **Environment Variables шалгах** (дээрх 7 variables байгаа эсэх)
2. **Git push хийх** (автоматаар deploy хийгдэнэ)
3. **Deployments дээр build log шалгах**
4. **Website тест хийх**

