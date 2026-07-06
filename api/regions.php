<?php
declare(strict_types=1);

/**
 * US region registry — keep in sync with src/config/regions/us.js
 * Only active regions are readable/writable for US listings.
 */

/** @return array<string, array{active:bool, state_codes:array<int,string>}> */
function us_regions_registry(): array
{
    return [
        'washington-dc' => [
            'active' => true,
            'state_codes' => ['DC', 'VA', 'MD'],
        ],
        'chicago' => [
            'active' => false,
            'state_codes' => ['IL'],
        ],
        'new-york' => [
            'active' => false,
            'state_codes' => ['NY'],
        ],
        'seattle' => [
            'active' => false,
            'state_codes' => ['WA'],
        ],
        'louisiana' => [
            'active' => false,
            'state_codes' => ['LA'],
        ],
    ];
}

function normalize_listing_region_code(string $code): string
{
    $normalized = strtolower(trim($code));
    $registry = us_regions_registry();
    return isset($registry[$normalized]) ? $normalized : '';
}

function get_default_us_region_code(): string
{
    foreach (us_regions_registry() as $code => $meta) {
        if (!empty($meta['active'])) {
            return $code;
        }
    }

    return 'washington-dc';
}

function is_active_us_region(string $regionCode): bool
{
    $code = normalize_listing_region_code($regionCode);
    if ($code === '') {
        return false;
    }
    $registry = us_regions_registry();

    return !empty($registry[$code]['active']);
}

/** @return array<int, string> */
function get_us_region_state_codes(string $regionCode): array
{
    $code = normalize_listing_region_code($regionCode);
    if ($code === '') {
        return [];
    }
    $registry = us_regions_registry();

    return $registry[$code]['state_codes'] ?? [];
}

function is_state_code_allowed_for_us_region(string $regionCode, string $stateCode): bool
{
    $allowed = get_us_region_state_codes($regionCode);
    $st = strtoupper(trim($stateCode));

    return $st !== '' && in_array($st, $allowed, true);
}

/**
 * Resolve effective region for US listing reads. Never returns inactive regions.
 * When country is US and no region requested, defaults to launch region (washington-dc).
 *
 * @return string|null null = do not apply region filter (KR / no column)
 */
function resolve_us_listing_read_region_code(string $countryCode, string $requestedRegionCode): ?string
{
    if ($countryCode !== 'US') {
        return null;
    }

    $requested = normalize_listing_region_code($requestedRegionCode);
    if ($requested !== '' && is_active_us_region($requested)) {
        return $requested;
    }

    if ($requested !== '' && !is_active_us_region($requested)) {
        return '__inactive__';
    }

    return get_default_us_region_code();
}

/**
 * Append SQL region filter for US reads. Inactive marker yields zero rows.
 *
 * @param array<string, mixed> $params
 */
function append_us_region_read_filter(PDO $pdo, string &$sql, array &$params, string $countryCode, string $requestedRegionCode): void
{
    if ($countryCode !== 'US' || !table_has($pdo, 'listings', 'region_code')) {
        return;
    }

    $effective = resolve_us_listing_read_region_code($countryCode, $requestedRegionCode);
    if ($effective === null) {
        return;
    }
    if ($effective === '__inactive__') {
        $sql .= ' AND 1=0';

        return;
    }

    // Strict: US public reads only scoped region rows (no NULL/unscoped US listings).
    $sql .= ' AND region_code = :region_code';
    $params[':region_code'] = $effective;
}

/**
 * Force US listing write scope for MVP (single active region).
 *
 * @param array<string, mixed> $payload
 */
function enforce_us_listing_write_region(PDO $pdo, array &$payload): void
{
    if (!table_has($pdo, 'listings', 'region_code')) {
        return;
    }

    $country = normalize_listing_country_code((string) ($payload['country_code'] ?? 'KR'));
    if ($country !== 'US') {
        unset($payload['region_code']);

        return;
    }

    $payload['country_code'] = 'US';
    $payload['region_code'] = get_default_us_region_code();

    if (table_has($pdo, 'listings', 'state_code')) {
        $state = normalize_listing_state_code((string) ($payload['state_code'] ?? ''));
        if ($state !== '' && !is_state_code_allowed_for_us_region($payload['region_code'], $state)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid state_code for region'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $payload['state_code'] = $state !== '' ? $state : null;
    }
}

/**
 * Hide US listings outside active region on GET by id (404).
 *
 * @param array<string, mixed> $row
 */
function enforce_us_listing_row_visible(PDO $pdo, array $row): void
{
    if (!table_has($pdo, 'listings', 'region_code')) {
        return;
    }

    $country = normalize_listing_country_code((string) ($row['country_code'] ?? 'KR'));
    if ($country !== 'US') {
        return;
    }

    $region = normalize_listing_region_code((string) ($row['region_code'] ?? ''));
    $default = get_default_us_region_code();
    if ($region === '' || !is_active_us_region($region) || $region !== $default) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/**
 * @return array{home_country_code:?string, home_region_code:?string}
 */
function get_user_home_market_by_firebase_uid(PDO $pdo, string $firebaseUid): array
{
    $empty = ['home_country_code' => null, 'home_region_code' => null];
    if ($firebaseUid === '' || !table_has($pdo, 'users', 'firebase_uid')) {
        return $empty;
    }
    if (!table_has($pdo, 'users', 'home_country_code')) {
        return $empty;
    }

    $cols = ['home_country_code'];
    if (table_has($pdo, 'users', 'home_region_code')) {
        $cols[] = 'home_region_code';
    }
    $sql = 'SELECT ' . implode(', ', $cols) . ' FROM users WHERE firebase_uid = :uid LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $firebaseUid]);
    $row = $stmt->fetch();
    if (!$row) {
        return $empty;
    }

    $country = isset($row['home_country_code']) ? normalize_listing_country_code((string) $row['home_country_code']) : '';
    $region = isset($row['home_region_code']) ? normalize_listing_region_code((string) $row['home_region_code']) : '';

    return [
        'home_country_code' => $country !== '' ? $country : null,
        'home_region_code' => $region !== '' ? $region : null,
    ];
}

/**
 * Redeem DMV invite — assigns users.home_country_code + home_region_code.
 *
 * @return array{home_country_code:string, home_region_code:string}
 */
function redeem_invite_code(PDO $pdo, string $firebaseUid, string $rawCode): array
{
    $code = strtoupper(trim($rawCode));
    if ($code === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid invite code'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (!table_has($pdo, 'invite_codes', 'code')) {
        http_response_code(503);
        echo json_encode(['error' => 'Invite system not available'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (!table_has($pdo, 'users', 'home_country_code') || !table_has($pdo, 'users', 'home_region_code')) {
        http_response_code(503);
        echo json_encode(['error' => 'Home market columns not available'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $existing = get_user_home_market_by_firebase_uid($pdo, $firebaseUid);
    if ($existing['home_country_code'] === 'US' && $existing['home_region_code'] !== null && is_active_us_region($existing['home_region_code'])) {
        return [
            'home_country_code' => 'US',
            'home_region_code' => $existing['home_region_code'],
        ];
    }

    $stmt = $pdo->prepare(
        'SELECT id, country_code, region_code, active, max_uses, used_count
         FROM invite_codes
         WHERE UPPER(code) = :code
         LIMIT 1'
    );
    $stmt->execute([':code' => $code]);
    $invite = $stmt->fetch();
    if (!$invite || empty($invite['active'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid invite code'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $country = normalize_listing_country_code((string) ($invite['country_code'] ?? 'US'));
    $region = normalize_listing_region_code((string) ($invite['region_code'] ?? ''));
    if ($country !== 'US' || $region === '' || !is_active_us_region($region)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invite code is not active'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $maxUses = isset($invite['max_uses']) ? (int) $invite['max_uses'] : null;
    $usedCount = isset($invite['used_count']) ? (int) $invite['used_count'] : 0;
    if ($maxUses !== null && $maxUses > 0 && $usedCount >= $maxUses) {
        http_response_code(400);
        echo json_encode(['error' => 'Invite code has reached its limit'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    upsert_user_best_effort($pdo, $firebaseUid, null);

    if (!table_has($pdo, 'users', 'firebase_uid')) {
        http_response_code(503);
        echo json_encode(['error' => 'User profile not available'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $u = $pdo->prepare(
        'UPDATE users SET home_country_code = :country, home_region_code = :region WHERE firebase_uid = :uid'
    );
    $u->execute([
        ':country' => $country,
        ':region' => $region,
        ':uid' => $firebaseUid,
    ]);

    if ($u->rowCount() === 0) {
        http_response_code(503);
        echo json_encode(['error' => 'User profile not found'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $inc = $pdo->prepare('UPDATE invite_codes SET used_count = used_count + 1 WHERE id = :id');
    $inc->execute([':id' => (int) $invite['id']]);

    return [
        'home_country_code' => $country,
        'home_region_code' => $region,
    ];
}
