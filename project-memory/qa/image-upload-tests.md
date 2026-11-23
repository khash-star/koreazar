# Image Upload Tests

Web (`src/`) and mobile (`mobile/`) — use `../qa/image-upload-tests.md` with platform column in report.

---

## Upload flow

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Select image(s) on create listing | ☐ | ☐ | Web / Mobile |
| Upload completes without 403 | ☐ | ☐ | |
| Progress / loading state acceptable | ☐ | ☐ | |
| Multiple images if supported | ☐ | ☐ | |
| Reject invalid format (non JPG/PNG/WEBP) | ☐ | ☐ | Web listing and banner pages. Native create re-encodes to JPEG before the 15MB check |
| Reject web original over 5MB | ☐ | ☐ | `CreateListing` / `EditListing` only. `limits.js` is not called |
| Reject mobile file over 15MB | ☐ | ☐ | `uploadImageFromUri`. A 6MB original is allowed on mobile and rejected on web |
| Web allows an 11th image; mobile stops at 10 | ☐ | ☐ | Mobile full grid returns with no alert. Web create also allows zero images; mobile requires one |
| 51st listing still creates | ☐ | ☐ | `MAX_LISTINGS_PER_USER` has no caller |

---

## Preview (create / edit)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Thumbnail preview before submit | ☐ | ☐ | |
| Remove image before submit works | ☐ | ☐ | |
| Compression applied if enabled | ☐ | ☐ | `imageCompressor` |

---

## Listing detail

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Primary image displays | ☐ | ☐ | |
| Gallery / additional images | ☐ | ☐ | |
| w800 or CDN URL pattern loads | ☐ | ☐ | |
| Correct listing after create navigation | ☐ | ☐ | |

---

## Mobile lightbox

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Tap image opens lightbox / full view | ☐ | ☐ | |
| Swipe between images | ☐ | ☐ | |
| Close lightbox returns to detail | ☐ | ☐ | |
| Orientation correct (portrait/landscape) | ☐ | ☐ | |

---

## Fallback image

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Missing/broken URL shows placeholder | ☐ | ☐ | |
| Home skeleton → image transition | ☐ | ☐ | Firestore-before-images path |
| No infinite skeleton on Firestore error | ☐ | ☐ | |

---

## Storage verification (optional)

| Check | Pass | Fail | Notes |
|-------|:----:|:----:|-------|
| Object visible in Firebase Console | ☐ | ☐ | |
| Path matches storage rules | ☐ | ☐ | |

See `../reviews/regression-review.md` (image section).
