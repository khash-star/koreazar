# Админ Эрх Тохируулах Зааварчилгаа

## ⚠️ Асуудал

Админ нэвтэрсэн боловч удирдлагын хэсэг харагдахгүй байна.  
Email: `khashpay@gmail.com`

## ✅ Шийдэл

Firestore дээр `users` collection дээр хэрэглэгчийн `role: 'admin'` тохируулах хэрэгтэй.

### Арга 1: Firebase Console дээр (Хамгийн хурдан)

1. **Firebase Console**: https://console.firebase.google.com
2. **koreazar-32e7a** project сонгох
3. **Firestore Database** → **Data** tab
4. **users** collection олох
5. Хэрэглэгчийн document олох (UID нь Firebase Auth дээрх UID байна)
   - Хэрэв байхгүй бол шинэ document үүсгэх (UID = Firebase Auth дээрх UID)
6. Document-ийг edit хийх:
   - `email`: `khashpay@gmail.com`
   - `role`: `admin` (заавал `admin` гэж бичих)
   - `displayName`: (хэрэв байгаа бол)
   - `createdAt`: (хэрэв байгаа бол)

### Арга 2: Browser Console дээр (Хурдан)

1. Browser дээр нэвтэрсэн байх
2. F12 → Console tab
3. Дараах код ажиллуулах:

```javascript
// Firebase-ийг import хийх
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0eE-wKhem4t7I3G-SKz7-f2IMmfWDjSk",
  authDomain: "koreazar-32e7a.firebaseapp.com",
  projectId: "koreazar-32e7a",
  storageBucket: "koreazar-32e7a.firebasestorage.app",
  messagingSenderId: "384960850116",
  appId: "1:384960850116:web:7bfcf963b92dace3b24191"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Хэрэглэгчийн UID авах
const user = auth.currentUser;
if (user) {
  const userRef = doc(db, 'users', user.uid);
  
  // Одоогийн user data авах
  getDoc(userRef).then((docSnap) => {
    if (docSnap.exists()) {
      // Document байгаа бол role-ийг update хийх
      setDoc(userRef, {
        ...docSnap.data(),
        role: 'admin',
        email: 'khashpay@gmail.com'
      }, { merge: true }).then(() => {
        console.log('✅ Админ эрх тохируулагдлаа!');
        window.location.reload();
      });
    } else {
      // Document байхгүй бол үүсгэх
      setDoc(userRef, {
        email: 'khashpay@gmail.com',
        displayName: 'Admin',
        role: 'admin',
        createdAt: new Date()
      }).then(() => {
        console.log('✅ Админ эрх тохируулагдлаа!');
        window.location.reload();
      });
    }
  });
} else {
  console.error('❌ Нэвтэрээгүй байна');
}
```

### Арга 3: Admin хуудсанд debug код нэмэх

Би debug код нэмж, console дээр userData харагдах болгох.

---

## 🔍 Шалгах

1. Browser refresh (`Ctrl+Shift+R`)
2. F12 → Console tab
3. `userData` харагдах эсэхийг шалгах
4. `userData.role === 'admin'` эсэхийг шалгах

---

## ⚠️ Чухал

- Firestore дээр `users` collection дээр user document байх ёстой
- `role` field нь яг `'admin'` байх ёстой (жижиг үсгээр)
- Document ID нь Firebase Auth дээрх UID байх ёстой

