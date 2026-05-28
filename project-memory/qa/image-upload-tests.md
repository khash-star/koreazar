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
| Reject invalid format (non JPG/PNG/WEBP) | ☐ | ☐ | |
| Reject oversize file (~5MB) | ☐ | ☐ | |

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
