<?php
declare(strict_types=1);

/**
 * Zarkorea PHP API (MySQL) — entry point.
 *
 * Usage (after upload + .env):
 *   GET index.php?action=health
 *   GET index.php?action=listings&category=real_estate&limit=20
 *   GET index.php?action=listing&id=123
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? 'health';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$debug = filter_var(getenv('APP_DEBUG') ?: 'false', FILTER_VALIDATE_BOOLEAN);

try {
    $pdo = db();

    switch ($action) {
        case 'health':
            $pdo->query('SELECT 1');
            echo json_encode([
                'ok' => true,
                'db' => 'connected',
                'time' => gmdate('c'),
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'listings':
            if ($method === 'GET') {
                $category = isset($_GET['category']) ? trim((string) $_GET['category']) : '';
                $subcategory = isset($_GET['subcategory']) ? trim((string) $_GET['subcategory']) : '';
                $status = isset($_GET['status']) ? trim((string) $_GET['status']) : 'active';
                $limit = isset($_GET['limit']) ? max(1, min(100, (int) $_GET['limit'])) : 50;

                $sql = 'SELECT * FROM listings WHERE 1=1';
                $params = [];

                if ($status !== '') {
                    $sql .= ' AND status = :status';
                    $params[':status'] = $status;
                }
                if ($category !== '') {
                    $sql .= ' AND category = :category';
                    $params[':category'] = $category;
                }
                if ($subcategory !== '') {
                    $sql .= ' AND subcategory = :subcategory';
                    $params[':subcategory'] = $subcategory;
                }

                $sql .= ' ORDER BY created_at DESC LIMIT ' . (int) $limit;

                $stmt = $pdo->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->execute();
                $rows = $stmt->fetchAll();

                $out = [];
                foreach ($rows as $row) {
                    $out[] = map_listing_row($row);
                }
                echo json_encode(['data' => $out], JSON_UNESCAPED_UNICODE);
                break;
            }

            if ($method === 'POST') {
                $authUser = require_firebase_user();
                $body = read_json_body();
                $payload = extract_listing_payload($body);
                $payload['firebase_uid'] = $authUser['uid'];
                $payload['created_by'] = $authUser['email'] ?? ($payload['created_by'] ?? null);
                if ($payload['title'] === '' || $payload['category'] === '') {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'title and category are required'
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }

                // Best-effort auxiliary upserts for legacy/shared schemas.
                upsert_user_best_effort($pdo, $authUser['uid'], $authUser['email']);
                ensure_category_best_effort($pdo, (string) $payload['category']);
                if (!empty($payload['location']) && is_string($payload['location'])) {
                    ensure_region_best_effort($pdo, $payload['location']);
                }

                $sql = 'INSERT INTO listings (
                    firebase_uid, created_by, category, subcategory, title, description, price, is_negotiable,
                    `condition`, status, listing_type, listing_type_expires, location, phone, kakao_id, wechat_id,
                    whatsapp, facebook, views, images
                ) VALUES (
                    :firebase_uid, :created_by, :category, :subcategory, :title, :description, :price, :is_negotiable,
                    :condition, :status, :listing_type, :listing_type_expires, :location, :phone, :kakao_id, :wechat_id,
                    :whatsapp, :facebook, :views, :images
                )';

                $stmt = $pdo->prepare($sql);
                $stmt->execute($payload);

                $id = (int) $pdo->lastInsertId();
                $created = fetch_listing_or_fail($pdo, $id);
                http_response_code(201);
                echo json_encode(['data' => map_listing_row($created)], JSON_UNESCAPED_UNICODE);
                break;
            }

            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed for action=listings'], JSON_UNESCAPED_UNICODE);
            break;

        case 'listing':
            $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing or invalid id'], JSON_UNESCAPED_UNICODE);
                break;
            }

            if ($method === 'GET') {
                $row = fetch_listing_or_null($pdo, $id);
                if (!$row) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                    break;
                }
                echo json_encode(['data' => map_listing_row($row)], JSON_UNESCAPED_UNICODE);
                break;
            }

            if ($method === 'PUT' || $method === 'PATCH') {
                $existing = fetch_listing_or_null($pdo, $id);
                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $body = read_json_body();
                $payload = extract_listing_payload($body, true);
                unset($payload['firebase_uid'], $payload['created_by']);

                // Allow public, view-only increment used by listing detail page.
                $isViewOnlyPayload = count($payload) === 1 && array_key_exists('views', $payload);
                $existingViews = isset($existing['views']) ? (int) $existing['views'] : 0;
                $requestedViews = isset($payload['views']) ? (int) $payload['views'] : $existingViews;
                if (!($isViewOnlyPayload && $requestedViews === $existingViews + 1)) {
                    $authUser = require_firebase_user();
                    enforce_listing_ownership($existing, $authUser);
                }

                $setParts = [];
                $params = [':id' => $id];
                foreach ($payload as $key => $value) {
                    $setParts[] = $key . ' = :' . $key;
                    $params[':' . $key] = $value;
                }

                if (count($setParts) === 0) {
                    http_response_code(400);
                    echo json_encode(['error' => 'No updatable fields provided'], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $sql = 'UPDATE listings SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = :id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                $updated = fetch_listing_or_fail($pdo, $id);
                echo json_encode(['data' => map_listing_row($updated)], JSON_UNESCAPED_UNICODE);
                break;
            }

            if ($method === 'DELETE') {
                $authUser = require_firebase_user();
                $existing = fetch_listing_or_null($pdo, $id);
                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                    break;
                }
                enforce_listing_ownership($existing, $authUser);
                $stmt = $pdo->prepare('DELETE FROM listings WHERE id = :id');
                $stmt->execute([':id' => $id]);
                if ($stmt->rowCount() === 0) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                    break;
                }
                echo json_encode(['ok' => true, 'deleted_id' => (string) $id], JSON_UNESCAPED_UNICODE);
                break;
            }

            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed for action=listing'], JSON_UNESCAPED_UNICODE);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Unknown action'], JSON_UNESCAPED_UNICODE);
    }
} catch (Throwable $e) {
    http_response_code(500);
    $payload = ['error' => 'Server error'];
    if ($debug) {
        $payload['message'] = $e->getMessage();
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}

/**
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function map_listing_row(array $row): array
{
    $id = (string) ($row['id'] ?? '');
    if (isset($row['images']) && is_string($row['images']) && $row['images'] !== '') {
        $decoded = json_decode($row['images'], true);
        $row['images'] = is_array($decoded) ? $decoded : [];
    } elseif (!isset($row['images'])) {
        $row['images'] = [];
    }

    $row['id'] = $id;
    if (isset($row['created_at'])) {
        $row['created_date'] = $row['created_at'];
    }
    if (isset($row['updated_at'])) {
        $row['updated_date'] = $row['updated_at'];
    }

    return $row;
}

/**
 * @return array<string,mixed>
 */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    return $decoded;
}

/**
 * @param array<string,mixed> $body
 * @return array<string,mixed>
 */
function extract_listing_payload(array $body, bool $partial = false): array
{
    $whitelist = [
        'firebase_uid', 'created_by', 'category', 'subcategory', 'title', 'description',
        'price', 'is_negotiable', 'condition', 'status', 'listing_type', 'listing_type_expires',
        'location', 'phone', 'kakao_id', 'wechat_id', 'whatsapp', 'facebook', 'views', 'images',
    ];

    $payload = [];
    foreach ($whitelist as $key) {
        if (!array_key_exists($key, $body)) {
            if ($partial) {
                continue;
            }
            if ($key === 'status') {
                $payload[$key] = 'active';
            } elseif ($key === 'is_negotiable') {
                $payload[$key] = 0;
            } elseif ($key === 'views') {
                $payload[$key] = 0;
            } else {
                $payload[$key] = null;
            }
            continue;
        }

        $val = $body[$key];
        if ($key === 'images') {
            if (is_array($val)) {
                $payload[$key] = json_encode($val, JSON_UNESCAPED_UNICODE);
            } elseif (is_string($val) && $val !== '') {
                $payload[$key] = $val;
            } else {
                $payload[$key] = json_encode([], JSON_UNESCAPED_UNICODE);
            }
            continue;
        }

        if (is_string($val)) {
            $payload[$key] = trim($val);
            continue;
        }
        if ($key === 'is_negotiable') {
            $payload[$key] = (int) (bool) $val;
            continue;
        }
        if ($key === 'views') {
            $payload[$key] = max(0, (int) $val);
            continue;
        }
        $payload[$key] = $val;
    }

    if (!$partial) {
        $payload['firebase_uid'] = (string) ($payload['firebase_uid'] ?? '');
        $payload['category'] = (string) ($payload['category'] ?? '');
        $payload['title'] = (string) ($payload['title'] ?? '');
    }
    return $payload;
}

/**
 * @return array<string,mixed>|false
 */
function fetch_listing_or_null(PDO $pdo, int $id)
{
    $stmt = $pdo->prepare('SELECT * FROM listings WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return $stmt->fetch();
}

/**
 * @return array<string,mixed>
 */
function fetch_listing_or_fail(PDO $pdo, int $id): array
{
    $row = fetch_listing_or_null($pdo, $id);
    if (!$row) {
        throw new RuntimeException('Listing not found after write');
    }
    return $row;
}

/**
 * Verifies Firebase ID token via Google Identity Toolkit.
 * Requires FIREBASE_WEB_API_KEY in api/.env
 *
 * @return array{uid:string,email:?string}
 */
function get_authorization_header(): string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION']) && is_string($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && is_string($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    $fromEnv = getenv('HTTP_AUTHORIZATION');
    if (is_string($fromEnv) && $fromEnv !== '') {
        return $fromEnv;
    }
    if (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        if (is_array($h)) {
            foreach ($h as $k => $v) {
                if (strcasecmp((string) $k, 'Authorization') === 0 && is_string($v)) {
                    return $v;
                }
            }
        }
    }
    if (function_exists('getallheaders')) {
        $h = getallheaders();
        if (is_array($h)) {
            foreach ($h as $k => $v) {
                if (strcasecmp((string) $k, 'Authorization') === 0 && is_string($v)) {
                    return $v;
                }
            }
        }
    }
    return '';
}

function require_firebase_user(): array
{
    $authHeader = get_authorization_header();
    if (!is_string($authHeader) || stripos($authHeader, 'Bearer ') !== 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Missing Authorization Bearer token'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idToken = trim(substr($authHeader, 7));
    if ($idToken === '') {
        http_response_code(401);
        echo json_encode(['error' => 'Empty Bearer token'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $apiKey = getenv('FIREBASE_WEB_API_KEY') ?: '';
    if ($apiKey === '') {
        throw new RuntimeException('FIREBASE_WEB_API_KEY missing in api/.env');
    }

    $url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' . rawurlencode($apiKey);
    $payload = json_encode(['idToken' => $idToken], JSON_UNESCAPED_UNICODE);
    if (!is_string($payload)) {
        throw new RuntimeException('Cannot encode auth payload');
    }

    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 12,
            'ignore_errors' => true,
        ]
    ];
    $ctx = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $ctx);
    if (!is_string($resp) || $resp === '') {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token or auth upstream error'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $json = json_decode($resp, true);
    if (!is_array($json) || !isset($json['users'][0]['localId'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Token verification failed'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $uid = (string) $json['users'][0]['localId'];
    $email = isset($json['users'][0]['email']) ? (string) $json['users'][0]['email'] : null;
    return ['uid' => $uid, 'email' => $email];
}

/**
 * @param array<string,mixed> $existing
 * @param array{uid:string,email:?string} $authUser
 */
function enforce_listing_ownership(array $existing, array $authUser): void
{
    $ownerUid = isset($existing['firebase_uid']) ? (string) $existing['firebase_uid'] : '';
    $uid = $authUser['uid'];
    if ($ownerUid === $uid) {
        return;
    }

    $adminUidsRaw = getenv('APP_ADMIN_UIDS') ?: '';
    $adminUids = array_values(array_filter(array_map('trim', explode(',', $adminUidsRaw))));
    if (in_array($uid, $adminUids, true)) {
        return;
    }

    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: not owner'], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * @return array<int,string>
 */
function get_table_columns(PDO $pdo, string $table): array
{
    try {
        $stmt = $pdo->query('SHOW COLUMNS FROM `' . str_replace('`', '', $table) . '`');
        $rows = $stmt ? $stmt->fetchAll() : [];
        $cols = [];
        foreach ($rows as $r) {
            if (isset($r['Field']) && is_string($r['Field'])) {
                $cols[] = $r['Field'];
            }
        }
        return $cols;
    } catch (Throwable $e) {
        return [];
    }
}

function table_has(PDO $pdo, string $table, string $col): bool
{
    static $cache = [];
    $key = $table . '::' . $col;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }
    $cols = get_table_columns($pdo, $table);
    $ok = in_array($col, $cols, true);
    $cache[$key] = $ok;
    return $ok;
}

function slugify(string $v): string
{
    $s = trim(mb_strtolower($v));
    if ($s === '') return '';
    $s = preg_replace('/[^a-z0-9]+/u', '-', $s);
    $s = trim((string) $s, '-');
    return $s === '' ? 'n-a' : $s;
}

function upsert_user_best_effort(PDO $pdo, string $firebaseUid, ?string $email): void
{
    if ($firebaseUid === '') return;
    try {
        $emailVal = $email ?: null;

        // Preferred schema: users(firebase_uid, email, display_name, role, ...)
        if (table_has($pdo, 'users', 'firebase_uid')) {
            $stmt = $pdo->prepare('SELECT id FROM users WHERE firebase_uid = :uid LIMIT 1');
            $stmt->execute([':uid' => $firebaseUid]);
            $row = $stmt->fetch();
            if ($row) {
                if (table_has($pdo, 'users', 'email')) {
                    $u = $pdo->prepare('UPDATE users SET email = COALESCE(:email, email), updated_at = NOW() WHERE id = :id');
                    $u->execute([':email' => $emailVal, ':id' => $row['id']]);
                }
                return;
            }

            $cols = ['firebase_uid'];
            $vals = [':firebase_uid'];
            $params = [':firebase_uid' => $firebaseUid];
            if (table_has($pdo, 'users', 'email')) {
                $cols[] = 'email';
                $vals[] = ':email';
                $params[':email'] = $emailVal;
            }
            if (table_has($pdo, 'users', 'role')) {
                $cols[] = 'role';
                $vals[] = ':role';
                $params[':role'] = 'user';
            }
            $sql = 'INSERT INTO users (' . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ')';
            $ins = $pdo->prepare($sql);
            $ins->execute($params);
            return;
        }

        // Legacy schema fallback: users(name, email, password, phone, role, ...)
        if (table_has($pdo, 'users', 'email')) {
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $emailVal]);
            $row = $stmt->fetch();
            if ($row) return;

            $cols = [];
            $vals = [];
            $params = [];
            if (table_has($pdo, 'users', 'name')) {
                $cols[] = 'name';
                $vals[] = ':name';
                $params[':name'] = $emailVal ? strstr($emailVal, '@', true) ?: 'user' : 'user';
            }
            if (table_has($pdo, 'users', 'email')) {
                $cols[] = 'email';
                $vals[] = ':email';
                $params[':email'] = $emailVal ?: ($firebaseUid . '@firebase.local');
            }
            if (table_has($pdo, 'users', 'password')) {
                $cols[] = 'password';
                $vals[] = ':password';
                $params[':password'] = '';
            }
            if (table_has($pdo, 'users', 'role')) {
                $cols[] = 'role';
                $vals[] = ':role';
                $params[':role'] = 'user';
            }
            if ($cols) {
                $sql = 'INSERT INTO users (' . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ')';
                $ins = $pdo->prepare($sql);
                $ins->execute($params);
            }
        }
    } catch (Throwable $e) {
        // Intentionally swallow: listing creation should still proceed.
    }
}

function ensure_category_best_effort(PDO $pdo, string $category): void
{
    $category = trim($category);
    if ($category === '') return;
    try {
        if (!table_has($pdo, 'categories', 'name') && !table_has($pdo, 'categories', 'slug')) return;

        $exists = false;
        if (table_has($pdo, 'categories', 'slug')) {
            $slug = slugify($category);
            $q = $pdo->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
            $q->execute([':slug' => $slug]);
            $exists = (bool) $q->fetch();
        }
        if (!$exists && table_has($pdo, 'categories', 'name')) {
            $q = $pdo->prepare('SELECT id FROM categories WHERE name = :name LIMIT 1');
            $q->execute([':name' => $category]);
            $exists = (bool) $q->fetch();
        }
        if ($exists) return;

        $cols = [];
        $vals = [];
        $params = [];
        if (table_has($pdo, 'categories', 'name')) {
            $cols[] = 'name';
            $vals[] = ':name';
            $params[':name'] = $category;
        }
        if (table_has($pdo, 'categories', 'slug')) {
            $cols[] = 'slug';
            $vals[] = ':slug';
            $params[':slug'] = slugify($category);
        }
        if (table_has($pdo, 'categories', 'sort_order')) {
            $cols[] = 'sort_order';
            $vals[] = ':sort_order';
            $params[':sort_order'] = 999;
        }
        if (table_has($pdo, 'categories', 'is_active')) {
            $cols[] = 'is_active';
            $vals[] = ':is_active';
            $params[':is_active'] = 1;
        }
        if (!$cols) return;

        $sql = 'INSERT INTO categories (' . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ')';
        $ins = $pdo->prepare($sql);
        $ins->execute($params);
    } catch (Throwable $e) {
        // best effort only
    }
}

function ensure_region_best_effort(PDO $pdo, string $region): void
{
    $region = trim($region);
    if ($region === '') return;
    try {
        if (!table_has($pdo, 'regions', 'name') && !table_has($pdo, 'regions', 'slug')) return;

        $exists = false;
        if (table_has($pdo, 'regions', 'slug')) {
            $slug = slugify($region);
            $q = $pdo->prepare('SELECT id FROM regions WHERE slug = :slug LIMIT 1');
            $q->execute([':slug' => $slug]);
            $exists = (bool) $q->fetch();
        }
        if (!$exists && table_has($pdo, 'regions', 'name')) {
            $q = $pdo->prepare('SELECT id FROM regions WHERE name = :name LIMIT 1');
            $q->execute([':name' => $region]);
            $exists = (bool) $q->fetch();
        }
        if ($exists) return;

        $cols = [];
        $vals = [];
        $params = [];
        if (table_has($pdo, 'regions', 'name')) {
            $cols[] = 'name';
            $vals[] = ':name';
            $params[':name'] = $region;
        }
        if (table_has($pdo, 'regions', 'slug')) {
            $cols[] = 'slug';
            $vals[] = ':slug';
            $params[':slug'] = slugify($region);
        }
        if (table_has($pdo, 'regions', 'sort_order')) {
            $cols[] = 'sort_order';
            $vals[] = ':sort_order';
            $params[':sort_order'] = 999;
        }
        if (table_has($pdo, 'regions', 'is_active')) {
            $cols[] = 'is_active';
            $vals[] = ':is_active';
            $params[':is_active'] = 1;
        }
        if (!$cols) return;

        $sql = 'INSERT INTO regions (' . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ')';
        $ins = $pdo->prepare($sql);
        $ins->execute($params);
    } catch (Throwable $e) {
        // best effort only
    }
}
