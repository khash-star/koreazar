# Code Refactoring Summary

## Completed Changes

### 1. Shared Constants – `conditionLabels` & `conditionOptions`
- **Added** `conditionLabels` and `conditionOptions` to `src/constants/listings.js`
- **Removed** duplicate definitions from:
  - `ListingCard.jsx`
  - `ListingDetail.jsx`
  - `ListingDetailScreen.js` (mobile)
  - `CreateListingScreen.js` (mobile) – replaced `CONDITION_OPTIONS` with `conditionOptions`
- **Updated** `CreateListing.jsx`, `EditListing.jsx`, `SearchBar.jsx` to use shared constants
- Synced to mobile via `npm run sync-listings`

### 2. Security Utilities Integration
- **Used** `src/utils/security.js` in `Register.jsx`:
  - `validatePassword()` for password validation
  - `isValidEmail()` for email format validation
- Security utils are now part of the app flow instead of unused

### 3. Removed `moment` Dependency
- **Replaced** `moment` with `date-fns` in `FeaturedListingCard.jsx`
- Uses `formatDistanceToNow` + `convertTimestamp` (firestoreDates)
- **Removed** `moment` from `package.json`

### 4. AIBot Route
- **Added** `/AIBot` route in `src/pages/index.jsx`
- AIBot page is now accessible at `/AIBot`

### 5. Imports Cleanup
- `ListingCard.jsx` – imports `categoryInfo`, `conditionLabels` from `@/constants/listings`
- `CreateListing.jsx`, `EditListing.jsx`, `SearchBar.jsx` – use `conditionOptions` from listings; `locations` from listings (re-export via `locations.js` kept for compatibility)

## Files Modified

| File | Changes |
|------|---------|
| `src/constants/listings.js` | Added `conditionLabels`, `conditionOptions` |
| `src/components/listings/ListingCard.jsx` | Use shared constants |
| `src/pages/ListingDetail.jsx` | Use shared constants |
| `src/pages/CreateListing.jsx` | Use `conditionOptions`, `locations` from listings |
| `src/pages/EditListing.jsx` | Same as CreateListing |
| `src/components/listings/SearchBar.jsx` | Use `conditionOptions` |
| `src/components/listings/FeaturedListingCard.jsx` | Replaced moment with date-fns |
| `src/pages/Register.jsx` | Use `validatePassword`, `isValidEmail` from security |
| `src/pages/index.jsx` | Added AIBot route |
| `mobile/src/constants/listingForm.js` | Export `conditionLabels`, `conditionOptions` |
| `mobile/src/screens/ListingDetailScreen.js` | Use `conditionLabels` from listings |
| `mobile/src/screens/CreateListingScreen.js` | Use `conditionOptions` from listingForm |
| `package.json` | Removed `moment` |

## Future Recommendations

1. **Large components** – Consider splitting `Home.jsx` (~780 lines) and `ListingDetail.jsx` (~660 lines) into smaller components
2. **Auth error messages** – Centralize web `Login.jsx` `getErrorMessage` and mobile `authErrorMessage` into a shared module
3. **Image utilities** – Unify `getListingImageUrl` between web and mobile if they diverge
4. **Radix UI audit** – Remove unused Radix components to reduce bundle size
