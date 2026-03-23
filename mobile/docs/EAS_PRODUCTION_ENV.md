# EAS production build — Firebase environment variables

Release апп нээгдэхэд crash гарвал ихэвчлэн **EAS дээр `EXPO_PUBLIC_FIREBASE_*` тохируулаагүй** байдаг.

Локал `.env` зөвхөн таны компьютер дээр ажиллана; **EAS сервер дээр build хийхэд** эдгээр утгууд тусад нь оруулах хэрэгтэй.

## Алхам

1. **[expo.dev](https://expo.dev)** → төсөл **zarkorea-app** → **Environment variables**

2. **Environment:** `production` (эсвэл `All environments`)

3. Дараах нэрүүдээр variable нэмнэ (утгыг Firebase Console → Project settings → Your apps → Web app-аас авна):

   | Name | Жишээ |
   |------|--------|
   | `EXPO_PUBLIC_FIREBASE_API_KEY` | AIza... |
   | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | project.firebaseapp.com |
   | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | project-id |
   | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | project-id.firebasestorage.app |
   | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
   | `EXPO_PUBLIC_FIREBASE_APP_ID` | 1:...:web:... |

   **Энэ төсөл (зөв bucket):** `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app` — Firebase Console → **Storage** дээрх bucket нэртэй **яг ижил** байх ёстой (`zarkorea.appspot.com` эсвэл хуучин `*.appspot.com` биш).

4. **Visibility:** `Plain text` (EXPO_PUBLIC нь bundle-д орно — "Secret" нь зарим тохиолдолд build-д орохгүй байж болно; Expo-ийн заавар дагана)

5. Дахин build:

   ```bash
   npx eas build --platform android --profile production
   ```

6. Шинэ AAB-ыг Play Console руу upload хийнэ.

## Шалгах

Build лог дээр `env: export EXPO_PUBLIC_FIREBASE_...` гэж харагдах ёстой (локал `expo start` шиг).
