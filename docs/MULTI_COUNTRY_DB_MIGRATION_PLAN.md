# Multi-country listings DB migration plan (KR / US / JP)

Status: **NOT executed**. This is a review + runbook only, per explicit
instruction not to run the production migration as part of this change.
Do not run any of this against production without a maintenance-window
sign-off and a verified backup.

## What this migration does

Adds two nullable/defaulted columns to the production `listings` table
(MySQL, database referenced in code/docs as `zarkorea_zarkorea`):

- `country_code CHAR(2) NOT NULL DEFAULT 'KR'` — `KR` / `US` / `JP`.
- `state_code CHAR(2) DEFAULT NULL` — US state abbreviation, unused for KR/JP.

Plus two secondary indexes (`listings_country_code_index`,
`listings_state_code_index`) and a one-time backfill of `country_code = 'KR'`
for any pre-existing row.

## Review finding: original script was not valid on real MySQL

The original `api/sql/migration_listings_country_code.sql` used
`ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. **Neither of
these is supported by MySQL** (they are MariaDB-only extensions); running
the original script on production MySQL would fail with a syntax error.
The script in this repo has been corrected to use
`INFORMATION_SCHEMA` checks + `PREPARE`/`EXECUTE` so it is valid MySQL and
safe to re-run (idempotent) — see `api/sql/migration_listings_country_code.sql`.
The SQL below is the corrected version.

## 1. Backup (run first, always)

```bash
# Full logical backup of the listings table (adjust host/user/db as needed).
# Run from a host with network access to the production DB.
mysqldump \
  --single-transaction \
  --routines --triggers \
  -h <PROD_DB_HOST> -u <PROD_DB_USER> -p \
  zarkorea_zarkorea listings > listings_backup_$(date +%Y%m%d_%H%M%S).sql

# Optional but recommended: full-database backup as a second safety net.
mysqldump \
  --single-transaction --routines --triggers \
  -h <PROD_DB_HOST> -u <PROD_DB_USER> -p \
  zarkorea_zarkorea > zarkorea_full_backup_$(date +%Y%m%d_%H%M%S).sql
```

Verify the dump is non-empty and restorable (e.g. `wc -l` the file, or
restore to a scratch/staging database) before proceeding.

## 2. Exact SQL to run

Run `api/sql/migration_listings_country_code.sql` in full, in order, in a
single `mysql` session against production:

```bash
mysql -h <PROD_DB_HOST> -u <PROD_DB_USER> -p zarkorea_zarkorea \
  < api/sql/migration_listings_country_code.sql
```

The script, step by step:

1. Adds `country_code` (only if it doesn't already exist).
2. Adds `state_code` (only if it doesn't already exist).
3. Backfills `country_code = 'KR'` for any row where it's `NULL`/blank
   (covers every existing row, since the column default already makes new
   inserts `'KR'`).
4. Adds `listings_country_code_index` (only if it doesn't already exist).
5. Adds `listings_state_code_index` (only if it doesn't already exist).

Being idempotent, it's safe to run more than once (e.g. if step 2 is
interrupted, re-running from the top is a no-op for already-applied steps).

## 3. Rollback SQL

Only needed if the migration must be fully reverted (e.g. the API/web
changes need to be rolled back too). Dropping `country_code` also drops its
index automatically in MySQL/InnoDB, but the code below is explicit:

```sql
-- Rollback: drop the multi-country columns and their indexes.
ALTER TABLE `listings` DROP INDEX `listings_state_code_index`;
ALTER TABLE `listings` DROP INDEX `listings_country_code_index`;
ALTER TABLE `listings` DROP COLUMN `state_code`;
ALTER TABLE `listings` DROP COLUMN `country_code`;
```

If an index/column was never created (e.g. rollback run twice), the
corresponding `DROP` statement will error — check with the verification
queries in section 5 first, or wrap each `DROP` the same
`INFORMATION_SCHEMA`-guarded way as the forward migration if a fully
idempotent rollback script is needed.

Restoring from the section 1 backup is the safest rollback if anything
looks wrong (`mysql ... zarkorea_zarkorea < listings_backup_<timestamp>.sql`).

## 4. Expected impact

- **Columns**: `ADD COLUMN ... DEFAULT 'KR'` / `DEFAULT NULL` on MySQL 8.0
  (InnoDB, `ROW_FORMAT=DYNAMIC`, no full-text/foreign-key edge cases here)
  uses `ALGORITHM=INSTANT` automatically — metadata-only change, no table
  rewrite, no long lock, safe on a live table of any size.
- **Backfill UPDATE**: only affects rows where `country_code` is currently
  `NULL`/blank. Since the column is added with `DEFAULT 'KR' NOT NULL`,
  every existing row already reads as `'KR'` the instant the column is
  added — the `UPDATE` is a no-op safety net for edge cases (e.g. a prior
  partial run that left blank values). Low risk, but on a very large table
  this is the one step that does a full table scan; consider running during
  low-traffic hours if `listings` is large.
- **Indexes**: `CREATE INDEX` on InnoDB defaults to `ALGORITHM=INPLACE`,
  which permits concurrent reads/writes (brief metadata lock only at
  start/end). Duration scales with table size but does not block the app.
- **Application compatibility**: `api/index.php` already checks
  `table_has($pdo, 'listings', 'country_code')` before reading/writing the
  column, so the API works identically before and after this migration —
  it's safe to deploy the migration ahead of, or after, the API/web code
  deploy. No downtime is required either way.
- **No data loss**: purely additive (2 new columns, 2 new indexes, 1
  backfill `UPDATE` that only touches `NULL`/blank values). Existing
  columns/rows are untouched.

## 5. Verification queries

Run after the migration, before considering it complete:

```sql
-- Columns exist with the expected type/default.
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings'
  AND COLUMN_NAME IN ('country_code', 'state_code');

-- Indexes exist.
SELECT INDEX_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings'
  AND INDEX_NAME IN ('listings_country_code_index', 'listings_state_code_index');

-- No row is left with a NULL/blank country_code (must return 0).
SELECT COUNT(*) AS bad_rows FROM `listings`
WHERE `country_code` IS NULL OR TRIM(`country_code`) = '';

-- Every existing (pre-migration) listing is now tagged KR (expected: equals
-- the total row count captured before the migration, i.e. no row was
-- silently misclassified as US/JP by the backfill).
SELECT country_code, COUNT(*) FROM `listings` GROUP BY country_code;

-- Spot-check a few rows still have their original data untouched.
SELECT id, title, price, location, country_code, state_code
FROM `listings` ORDER BY id DESC LIMIT 5;
```

After running these, functionally verify via the API:
`GET /index.php?action=listings&country_code=KR` should return the same
listings as before the migration (all of them, since KR is the only market
with real data); `?country_code=US` / `?country_code=JP` should return an
empty array until real US/JP listings are created.
