# TWA-г RN аппаар солих — Play Store

## 1. Бэлтгэл

- RN апп: `package: com.zarkorea.twa` (TWA-тай ижил)
- `versionCode: 6` (TWA нь 5 байсан)
- Keystore: TWA-н `android.keystore` ашиглана (ижил гарын үсэгтэй байх ёстой)

## 2. Keystore — EAS-д оруулах

TWA-н keystore (zar төслийн `android.keystore`) байвал:

```bash
cd zarkorea-app
npx eas-cli login
npx eas credentials
```

→ **Android** → **production** → **Set up a custom keystore**:
- Keystore path: `../zar-746103b7/android.keystore` (эсвэл хуулсан файлын зам)
- Keystore password
- Key alias: `android`
- Key password

Ингэснээр EAS нь ижил гарын үсгээр RN аппыг байршуулна.

## 3. Build хийх

```bash
npx eas build --platform android --profile production
```

AAB файл EAS дээр бий болно.

## 4. Play Console

1. [Play Console](https://play.google.com/console) → **Zarkorea** (TWA апп)
2. **Production** → **Create new release**
3. AAB upload (EAS-аас татаж эсвэл `eas submit` ашиглах)
4. Release notes: "Бодит апп — чат, зар нэмэх зэрэг шинэ боломжууд"
5. **Review and rollout**

## 5. Keystore хэрэв шинэ бол

Хэрэв keystore одоогоор байхгүй эсвэл шинэ үүсгэж байгаа бол:

- **Эхний удаа:** `eas credentials` → **Generate new keystore** сонгож болно
- **TWA аль хэдийн publish хийгдсэн бол:** Өмнөх TWA-н keystore заавал ашиглах ёстой, өөрөөр Play Store update-ийг зөвшөөрөхгүй

## 6. Товч дараалал

```
Keystore бэлэн болох
  → eas credentials (custom keystore оруулах)
  → eas build --platform android --profile production
  → Play Console дээр AAB upload
  → Rollout
```
