# Known Bugs and Fixes

## Expo Image Orientation

* iOS images may rotate incorrectly
* normalizeImageOrientation.js handles fixes

## Firebase Auth

* Web uses VITE_* env vars
* Expo uses EXPO_PUBLIC_* env vars

## EAS Builds

* Native dependency changes require new EAS build

## Metro Cache

Clear cache using:

npx expo start -c
