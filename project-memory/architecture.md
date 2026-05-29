# Koreazar Project Architecture

## Stack

* React/Vite web app
* Expo React Native mobile app
* Firebase Auth
* Firestore
* Firebase Storage
* Expo Notifications
* Vercel deployment
* Expo EAS builds

## Shared Systems

* Shared Firebase services between web and mobile
* Shared authentication flow
* Shared image upload system

## Critical Rules

* Never break Expo compatibility
* Preserve Firebase auth flow
* Preserve image orientation fixes
* Preserve push notification compatibility
* Preserve SEO routing
* Preserve responsive layouts

## Deployment

* Web: Vercel
* Mobile: Expo EAS
* Backend: Firebase
* Legacy systems: cPanel/PHP

## Known Risks

* Expo dependency conflicts
* Firebase permission rules
* Image orientation issues on iOS
* Metro cache issues
* EAS build compatibility
