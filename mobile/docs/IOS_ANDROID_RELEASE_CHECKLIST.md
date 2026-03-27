# iOS / Android Release Checklist

This checklist is for final QA before App Store / Play submission.

## QA Sign-off Table

| Area | iOS | Android | Notes |
|------|-----|---------|-------|
| Auth (register/login/logout) | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| Account deletion | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| Listing create/upload | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| My Listings actions | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| Messaging/chat refresh | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| Deep links (`zarkorea://`) | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| Background -> foreground behavior | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| Store metadata consistency | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |

## 1) Permissions (least privilege)

- Android `mobile/app.json` does **not** request unused dangerous permissions.
- Image pick flow works with gallery permission prompt only.
- Account deletion and auth flows work without extra permission prompts.

## 2) Auth + Account Data

- Register on mobile -> login succeeds -> profile loads.
- Existing account login syncs user to backend (`user_sync`) without duplicate users.
- Delete account flow works end-to-end and signs out user.

## 3) Listing Flows

- Create listing with image upload works on iOS and Android.
- My Listings shows only current user's listings.
- Edit/VIP external links open safely.
- Listing detail phone action (`tel:`) handles unavailable dialer safely.

## 4) Background / Foreground Behavior

- Put app in background for >=30s and return to foreground.
- Messages list refreshes after foreground resume.
- Chat refreshes after foreground resume.
- Admin pending counts refresh after foreground resume.
- No runaway polling when app is backgrounded.

## 5) Deep Link Checks (custom scheme)

Supported prefix: `zarkorea://`

Test cases:

- `zarkorea://login` -> opens Login screen
- `zarkorea://register` -> opens Register screen
- `zarkorea://listing/123` -> opens Listing detail route
- `zarkorea://messages` -> opens Messages list
- `zarkorea://chat/test%40mail.com` -> opens Chat route with decoded email
- `zarkorea://profile` -> opens Profile tab
- `zarkorea://my-listings` -> opens My Listings

## 6) Upload Safety

- Upload image < 15MB succeeds.
- Upload image > 15MB shows validation error.
- Upload remains stable on lower-memory Android device.

## 7) Store Metadata Consistency

- Do not claim Push Notifications unless implemented in app and configured.
- Privacy policy link opens correctly from Profile help section.
- Data safety forms match actual permissions and data usage.
