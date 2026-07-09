# Нэвтрэх Асуудал Шидвэрлэх

## ⚠️ Нэвтрэх боломжгүй байна

### 1. Firebase Authentication идэвхжсэн эсэхийг шалгах

1. Firebase Console: https://console.firebase.google.com
2. **koreazar-32e7a** project сонгох
3. **Authentication** → **Get started** (эсвэл **Sign-in method** tab)
4. **Email/Password** идэвхжүүлэх:
   - **Enable** toggle идэвхжүүлэх
   - **Save** дарах

### 2. Firebase Config шалгах

`.env` файлд зөв config байгаа эсэхийг шалгах:

```env
VITE_FIREBASE_API_KEY=AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk
VITE_FIREBASE_AUTH_DOMAIN=koreazar-32e7a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koreazar-32e7a
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=384960850116
VITE_FIREBASE_APP_ID=1:384960850116:web:7bfcf963b92dace3b24191
```

### 3. Dev Server дахин эхлүүлэх

```bash
# Terminal дээр Ctrl+C
npm run dev
```

### 4. Browser Console шалгах

Browser дээр F12 → Console tab:
- Алдааны мессеж юу байгаа эсэхийг шалгах
- "Firebase config is missing" гэсэн алдаа гарч байгаа эсэх

### 5. Хэрэглэгч үүсгэх

Хэрэв хэрэглэгч байхгүй бол:

1. **Register** хуудас руу орох
2. Шинэ account үүсгэх
3. Дараа нь нэвтрэх

### 6. Алдааны мессежүүд

#### "Firebase config is missing"
- `.env` файл байгаа эсэхийг шалгах
- Dev server restart хийх

#### "auth/user-not-found"
- Хэрэглэгч бүртгэлгүй байна
- Register хуудас руу орох

#### "auth/wrong-password" эсвэл "auth/invalid-credential"
- Нууц үг эсвэл имэйл буруу байна
- Нууц үг сэргээх ашиглах

#### "auth/too-many-requests"
- Хэт олон удаа оролдсон
- Түр хүлээгээд дахин оролдох

#### "400 Bad Request"
- Firebase config буруу байна
- `.env` файл шалгах

---

**Хамгийн чухал:** Firebase Console дээр Authentication → Email/Password идэвхжүүлэх!

