# Zarusa staging deploy — Washington DC / DMV MVP

**Order matters.** Do not skip steps.

## 1) MySQL (staging DB only)

Run once on staging/scratch (not production until approved):

```
api/sql/migration_region_dmv_mvp.sql
```

Verify:

```sql
SHOW COLUMNS FROM listings LIKE 'region_code';
SHOW INDEX FROM listings WHERE Key_name = 'listings_country_region_index';
```

## 2) PHP upload (cPanel → api.zarkorea.com document root)

Upload **both** files (regions.php is required):

| Local file | Server |
|------------|--------|
| `api/index.php` | `index.php` |
| `api/regions.php` | `regions.php` |

Do **not** delete `bootstrap.php`, `banned_content.php`, `.env`, `.htaccess`.

## 3) Verify API (from repo root)

```powershell
npm run smoke:zarusa-api
```

After successful deploy + migration, expect:

- KR listings OK
- US listings include `region_code` (or empty until US rows exist)
- `GET ...&country_code=US&region_code=chicago` → empty array

## 4) Mobile staging build (optional — not store submit)

```powershell
cd mobile
npx eas build --platform android --profile production-us
```

Checklist on device:

- [ ] App opens **Main** directly (no invite screen)
- [ ] Header: **ZARUSA — DC / DMV**
- [ ] Home feed: US listings only, washington-dc scoped
- [ ] Create listing: state picker **DC, VA, MD only**
- [ ] KR `production` build unchanged (no region param)

## 5) Production gate

Do **not** until staging passes:

- Production MySQL migration
- Production PHP deploy (if separate from staging)
- EAS submit to stores

## Rollback

- Re-upload previous `index.php` (keep backup before upload)
- Remove `regions.php` only if reverting to pre-region API (old index without require)
- DB: `region_code` column can stay NULL-safe; no urgent rollback needed
