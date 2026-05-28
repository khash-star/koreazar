# Web Regression Tests

**Env:** `npm run dev` → http://localhost:5173 (or team port)  
**Also:** `npm run build` + `npm run preview` for production bundle smoke.

---

## Routes & navigation

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| `/` (Home) loads | ☐ | ☐ | |
| `/Login` loads | ☐ | ☐ | |
| `/Register` loads | ☐ | ☐ | |
| `/ListingDetail?id=<valid>` opens correct listing | ☐ | ☐ | |
| `/CreateListing` (auth required) | ☐ | ☐ | |
| `/MyListings`, `/SavedListings`, `/Messages`, `/Chat` | ☐ | ☐ | If touched |
| Browser back/forward on SPA | ☐ | ☐ | |
| No redirect to legacy Base44 login | ☐ | ☐ | |

---

## Listing flow

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Home shows listing cards after load | ☐ | ☐ | |
| Banner strip loads (`banner_ads`) | ☐ | ☐ | |
| Open listing from card → detail | ☐ | ☐ | |
| Create listing → redirects to detail with new ID | ☐ | ☐ | See root `TESTING_FLOW.md` |
| Edit own listing | ☐ | ☐ | |
| Save / unsave listing | ☐ | ☐ | |

---

## Search & filter

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Category filter updates list | ☐ | ☐ | |
| Subcategory / location if applicable | ☐ | ☐ | |
| Search (if UI present) returns expected results | ☐ | ☐ | |
| Empty state when no results | ☐ | ☐ | |
| No Firestore index error in console on filter | ☐ | ☐ | |

---

## Auth

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Register new user → Firestore `users` doc | ☐ | ☐ | |
| Login → Home, session persists on refresh | ☐ | ☐ | |
| Logout → guest UI | ☐ | ☐ | |
| Protected route blocks guest | ☐ | ☐ | |
| Password reset email (if touched) | ☐ | ☐ | |

---

## Image display

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Listing images load on Home (after Firestore) | ☐ | ☐ | |
| Detail gallery / thumbnails | ☐ | ☐ | |
| Broken image fallback (if implemented) | ☐ | ☐ | |
| No mixed-content / CSP block in console | ☐ | ☐ | |

---

## Console

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| No uncaught errors on Home | ☐ | ☐ | |
| No `failed-precondition` (index) | ☐ | ☐ | |
| No `permission-denied` on happy path | ☐ | ☐ | |
