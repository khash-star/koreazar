# KakaoTalk Login Setup Guide

## 🔧 Тохиргоо

### 1. Kakao Developers Console дээр App үүсгэх

1. https://developers.kakao.com руу орох
2. "내 애플리케이션" (My Applications) → "애플리케이션 추가하기" (Add Application)
3. App name оруулах (жишээ: `koreazar-app`)
4. "저장" (Save) дарах

### 2. Kakao JavaScript Key авах

1. App settings → "앱 키" (App Keys) tab руу орох
2. **JavaScript 키** (JavaScript Key) хуулж авах
3. `.env` файлд нэмэх:
   ```
   VITE_KAKAO_JS_KEY=your_javascript_key_here
   ```

### 3. Redirect URI тохируулах

1. App settings → "플랫폼" (Platform) tab руу орох
2. "Web" platform нэмэх
3. **사이트 도메인** (Site Domain) оруулах:
   - Local: `http://localhost:5173`
   - Production: `https://your-domain.vercel.app`

### 4. Kakao Login 활성화

1. App settings → "제품 설정" (Product Settings) → "카카오 로그인" (Kakao Login)
2. "활성화 설정" (Activation Settings) → ON
3. **Redirect URI** нэмэх:
   - Local: `http://localhost:5173`
   - Production: `https://your-domain.vercel.app`

### 5. 동의항목 (Consent Items) 설정

1. "제품 설정" → "카카오 로그인" → "동의항목" (Consent Items)
2. **필수 동의** (Required):
   - ✅ 닉네임 (Nickname)
   - ✅ 이메일 (Email) - хэрэв хүсвэл
3. **선택 동의** (Optional):
   - 프로필 사진 (Profile Image)

---

## 🔐 Backend API Route (Vercel Serverless Function)

Kakao token-ийг Firebase custom token руу хөрвүүлэх backend function үүсгэх хэрэгтэй.

### Vercel API Route үүсгэх:

**File:** `api/auth/kakao.js` (root directory дээр)

```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (only on server)
if (!initializeApp.length || typeof window === 'undefined') {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { kakaoToken, kakaoUserInfo } = req.body;

    if (!kakaoToken || !kakaoUserInfo) {
      return res.status(400).json({ error: 'Missing kakaoToken or kakaoUserInfo' });
    }

    // Verify Kakao token with Kakao API
    const kakaoResponse = await fetch('https://kapi.kakao.com/v1/user/access_token_info', {
      headers: {
        Authorization: `Bearer ${kakaoToken}`,
      },
    });

    if (!kakaoResponse.ok) {
      return res.status(401).json({ error: 'Invalid Kakao token' });
    }

    // Create or get Firebase user
    const auth = getAuth();
    const uid = `kakao:${kakaoUserInfo.id}`;
    
    let firebaseUser;
    try {
      firebaseUser = await auth.getUser(uid);
    } catch (error) {
      // User doesn't exist, create it
      firebaseUser = await auth.createUser({
        uid,
        email: kakaoUserInfo.email,
        displayName: kakaoUserInfo.nickname,
        photoURL: kakaoUserInfo.profile_image,
      });
    }

    // Create custom token
    const customToken = await auth.createCustomToken(uid);

    // Save user data to Firestore
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    await db.collection('users').doc(uid).set({
      email: kakaoUserInfo.email,
      displayName: kakaoUserInfo.nickname,
      photoURL: kakaoUserInfo.profile_image,
      provider: 'kakao',
      kakaoId: kakaoUserInfo.id,
      updated_at: new Date(),
    }, { merge: true });

    return res.status(200).json({ customToken });
  } catch (error) {
    console.error('Kakao auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 📦 Dependencies суулгах

```bash
npm install firebase-admin
```

---

## 🔑 Environment Variables (Vercel)

Vercel дээр дараах environment variables нэмэх:

1. `FIREBASE_PROJECT_ID` - Firebase project ID
2. `FIREBASE_CLIENT_EMAIL` - Firebase Admin SDK service account email
3. `FIREBASE_PRIVATE_KEY` - Firebase Admin SDK private key (newlines-ийг `\n` гэж энкодлэх)
4. `VITE_KAKAO_JS_KEY` - Kakao JavaScript Key

---

## ⚠️ Анхаарах зүйлс:

1. **Firebase Admin SDK**: Server-side дээр л ажиллана (Vercel API route)
2. **Custom Token**: Client-side дээр Firebase Auth-д custom token ашиглан нэвтрүүлнэ
3. **User UID**: Kakao ID-г ашиглан `kakao:${kakaoId}` форматтай UID үүсгэнэ
4. **Firestore Users Collection**: User мэдээлэл Firestore-д хадгална

---

## ✅ Тест хийх:

1. Local dev server эхлүүлэх
2. Login хуудас руу орох
3. "KakaoTalk-р нэвтрэх" button дарах
4. Kakao login popup гарч ирэх
5. Нэвтрэх
6. Firebase Authentication-д нэвтэрсэн эсэхийг шалгах

---

## 🐛 Алдаа засах:

### "KAKAO_JS_KEY is not set"
- `.env` файлд `VITE_KAKAO_JS_KEY` нэмэх

### "Failed to load Kakao SDK"
- Интернэт холболт шалгах
- Kakao SDK script ачаалагдаж байгаа эсэхийг browser console-д шалгах

### "Failed to get custom token"
- Backend API route (`/api/auth/kakao`) зөв ажиллаж байгаа эсэхийг шалгах
- Firebase Admin SDK тохиргоо шалгах

