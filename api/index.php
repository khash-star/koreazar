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

/**
 * MySQL column names in SET must be quoted when reserved (`condition`, `status`, …).
 */
function quote_mysql_identifier(string $name): string
{
    return '`' . str_replace('`', '``', $name) . '`';
}

/**
 * JS/Firebase ISO-8601 → MySQL DATETIME (YYYY-MM-DD HH:MM:SS).
 */
function normalize_mysql_datetime($val): ?string
{
    if ($val === null || $val === '') {
        return null;
    }
    if (!is_string($val) && !is_numeric($val)) {
        return null;
    }
    $s = trim((string) $val);
    if ($s === '') {
        return null;
    }
    try {
        return (new DateTimeImmutable($s))->format('Y-m-d H:i:s');
    } catch (Throwable $e) {
        return null;
    }
}

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

        case 'ai_chat':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed for action=ai_chat'], JSON_UNESCAPED_UNICODE);
                break;
            }
            require_firebase_user();
            $body = read_json_body();
            $messages = isset($body['messages']) && is_array($body['messages']) ? $body['messages'] : [];
            if (count($messages) === 0) {
                http_response_code(400);
                echo json_encode(['error' => 'messages is required'], JSON_UNESCAPED_UNICODE);
                break;
            }
            $temperature = isset($body['temperature']) ? (float) $body['temperature'] : 0.7;
            $maxTokens = isset($body['max_tokens']) ? (int) $body['max_tokens'] : 500;
            $openai = openai_chat_completion([
                'model' => (string) (getenv('OPENAI_MODEL') ?: 'gpt-4o-mini'),
                'messages' => $messages,
                'temperature' => max(0.0, min(1.5, $temperature)),
                'max_tokens' => max(32, min(1200, $maxTokens)),
            ]);
            if (!isset($openai['choices'][0]['message']['content'])) {
                throw new RuntimeException('Invalid OpenAI response format');
            }
            echo json_encode([
                'data' => [
                    'response' => (string) $openai['choices'][0]['message']['content'],
                    'usage' => $openai['usage'] ?? null,
                ],
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'ai_moderate':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed for action=ai_moderate'], JSON_UNESCAPED_UNICODE);
                break;
            }
            require_firebase_user();
            $body = read_json_body();
            $systemPrompt = isset($body['systemPrompt']) ? trim((string) $body['systemPrompt']) : '';
            $userPrompt = isset($body['userPrompt']) ? trim((string) $body['userPrompt']) : '';
            if ($systemPrompt === '' || $userPrompt === '') {
                http_response_code(400);
                echo json_encode(['error' => 'systemPrompt and userPrompt are required'], JSON_UNESCAPED_UNICODE);
                break;
            }
            $openai = openai_chat_completion([
                'model' => (string) (getenv('OPENAI_MODEL') ?: 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.3,
                'max_tokens' => 500,
                'response_format' => ['type' => 'json_object'],
            ]);
            $raw = isset($openai['choices'][0]['message']['content']) ? (string) $openai['choices'][0]['message']['content'] : '{}';
            echo json_encode(['data' => ['raw' => $raw, 'usage' => $openai['usage'] ?? null]], JSON_UNESCAPED_UNICODE);
            break;

        case 'listings':
            if ($method === 'GET') {
                $category = isset($_GET['category']) ? trim((string) $_GET['category']) : '';
                $subcategory = isset($_GET['subcategory']) ? trim((string) $_GET['subcategory']) : '';
                $createdBy = isset($_GET['created_by']) ? trim((string) $_GET['created_by']) : '';
                $customerIdFilter = isset($_GET['customer_id']) ? (int) $_GET['customer_id'] : 0;
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
                if ($createdBy !== '') {
                    $sql .= ' AND created_by = :created_by';
                    $params[':created_by'] = $createdBy;
                }
                if ($customerIdFilter > 0 && table_has($pdo, 'listings', 'customer_id')) {
                    $sql .= ' AND customer_id = :customer_id';
                    $params[':customer_id'] = $customerIdFilter;
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

                enforce_listing_promotion_privileges($pdo, $authUser, $payload, null, true);

                // Best-effort auxiliary upserts for legacy/shared schemas.
                upsert_user_best_effort($pdo, $authUser['uid'], $authUser['email']);
                $listingCustomerId = get_user_customer_id_by_firebase_uid($pdo, $authUser['uid']);
                ensure_category_best_effort($pdo, (string) $payload['category']);
                if (!empty($payload['location']) && is_string($payload['location'])) {
                    ensure_region_best_effort($pdo, $payload['location']);
                }

                $hasListingCustomerId = table_has($pdo, 'listings', 'customer_id');
                if ($hasListingCustomerId) {
                    $payload['customer_id'] = $listingCustomerId;
                }

                $sql = 'INSERT INTO listings (
                    firebase_uid, ' . ($hasListingCustomerId ? 'customer_id, ' : '') . 'created_by, category, subcategory, title, description, price, is_negotiable,
                    `condition`, status, listing_type, listing_type_expires, location, phone, kakao_id, wechat_id,
                    whatsapp, facebook, views, images
                ) VALUES (
                    :firebase_uid, ' . ($hasListingCustomerId ? ':customer_id, ' : '') . ':created_by, :category, :subcategory, :title, :description, :price, :is_negotiable,
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
                unset($payload['firebase_uid'], $payload['created_by'], $payload['customer_id']);

                // Allow public, view-only increment used by listing detail page.
                $isViewOnlyPayload = count($payload) === 1 && array_key_exists('views', $payload);
                $existingViews = isset($existing['views']) ? (int) $existing['views'] : 0;
                $requestedViews = isset($payload['views']) ? (int) $payload['views'] : $existingViews;
                if (!($isViewOnlyPayload && $requestedViews === $existingViews + 1)) {
                    $authUser = require_firebase_user();
                    enforce_listing_ownership($pdo, $existing, $authUser);
                    enforce_listing_promotion_privileges($pdo, $authUser, $payload, $existing, false);
                }

                $setParts = [];
                $params = [':id' => $id];
                foreach ($payload as $key => $value) {
                    $setParts[] = quote_mysql_identifier($key) . ' = :' . $key;
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
                enforce_listing_ownership($pdo, $existing, $authUser);
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

        case 'user_sync':
            if ($method !== 'POST' && $method !== 'PUT' && $method !== 'PATCH') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed for action=user_sync'], JSON_UNESCAPED_UNICODE);
                break;
            }
            $authUser = require_firebase_user();
            $body = read_json_body();
            upsert_user_profile_best_effort($pdo, $authUser['uid'], $authUser['email'], $body);
            $customerId = get_user_customer_id_by_firebase_uid($pdo, $authUser['uid']);
            echo json_encode([
                'ok' => true,
                'uid' => $authUser['uid'],
                'email' => $authUser['email'],
                'customer_id' => $customerId,
            ], JSON_UNESCAPED_UNICODE);
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
                $payload[$key] = 'pending';
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

        if ($key === 'listing_type_expires') {
            $payload[$key] = normalize_mysql_datetime($val);
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
 * @param array<string,mixed> $payload
 * @return array<string,mixed>
 */
function openai_chat_completion(array $payload): array
{
    $apiKey = trim((string) (getenv('OPENAI_API_KEY') ?: ''));
    if ($apiKey === '') {
        throw new RuntimeException('OPENAI_API_KEY missing in api/.env');
    }

    $url = 'https://api.openai.com/v1/chat/completions';
    $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if (!is_string($jsonPayload)) {
        throw new RuntimeException('Cannot encode OpenAI payload');
    }

    $headers = [
        "Authorization: Bearer {$apiKey}",
        'Content-Type: application/json',
    ];

    $resp = null;
    $statusCode = 0;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_TIMEOUT, 25);
        $resp = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($resp === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('OpenAI request failed: ' . $err);
        }
        curl_close($ch);
    } else {
        $opts = [
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => $jsonPayload,
                'timeout' => 25,
                'ignore_errors' => true,
            ],
        ];
        $ctx = stream_context_create($opts);
        $resp = @file_get_contents($url, false, $ctx);
        if (!is_string($resp)) {
            throw new RuntimeException('OpenAI request failed');
        }
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', (string) $http_response_header[0], $m)) {
            $statusCode = (int) $m[1];
        }
    }

    $decoded = json_decode((string) $resp, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid OpenAI response');
    }
    if ($statusCode >= 400) {
        $message = isset($decoded['error']['message']) ? (string) $decoded['error']['message'] : 'OpenAI request failed';
        throw new RuntimeException($message);
    }
    return $decoded;
}

/**
 * @param array<string,mixed> $existing
 * @param array{uid:string,email:?string} $authUser
 */
function enforce_listing_ownership(PDO $pdo, array $existing, array $authUser): void
{
    $ownerUid = isset($existing['firebase_uid']) ? (string) $existing['firebase_uid'] : '';
    $uid = $authUser['uid'];
    if ($ownerUid === $uid) {
        return;
    }
    if (is_app_admin($pdo, $authUser)) {
        return;
    }

    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: not owner'], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * @param mixed $v
 */
function normalize_listing_type_value($v): string
{
    if ($v === null || $v === '') {
        return '';
    }

    return strtolower(trim((string) $v));
}

/**
 * App admin: APP_ADMIN_UIDS env and/or MySQL users.role = admin (when schema supports it).
 *
 * @param array{uid:string,email:?string} $authUser
 */
function is_app_admin(PDO $pdo, array $authUser): bool
{
    $uid = isset($authUser['uid']) ? (string) $authUser['uid'] : '';
    if ($uid === '') {
        return false;
    }

    $adminUidsRaw = getenv('APP_ADMIN_UIDS') ?: '';
    $adminUids = array_values(array_filter(array_map('trim', explode(',', $adminUidsRaw))));
    if (in_array($uid, $adminUids, true)) {
        return true;
    }

    if (table_has($pdo, 'users', 'firebase_uid') && table_has($pdo, 'users', 'role')) {
        try {
            $stmt = $pdo->prepare('SELECT role FROM users WHERE firebase_uid = :uid LIMIT 1');
            $stmt->execute([':uid' => $uid]);
            $row = $stmt->fetch();
            if ($row && isset($row['role']) && normalize_listing_type_value($row['role']) === 'admin') {
                return true;
            }
        } catch (Throwable $e) {
        }
    }

    return false;
}

/**
 * Non-admins cannot self-assign VIP/Featured or extend VIP expiry (use admin panel / APP_ADMIN_UIDS).
 *
 * @param array<string,mixed> $payload
 * @param array<string,mixed>|null $existing
 * @param array{uid:string,email:?string} $authUser
 */
function enforce_listing_promotion_privileges(PDO $pdo, array $authUser, array $payload, ?array $existing, bool $isCreate): void
{
    if (is_app_admin($pdo, $authUser)) {
        return;
    }

    if ($isCreate) {
        $lt = normalize_listing_type_value($payload['listing_type'] ?? '');
        if ($lt === 'vip' || $lt === 'featured') {
            http_response_code(403);
            echo json_encode(['error' => 'VIP/Онцгой зар олгох эрх зөвхөн админд'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        return;
    }

    if ($existing === null) {
        return;
    }

    if (array_key_exists('listing_type', $payload)) {
        $lt = normalize_listing_type_value($payload['listing_type']);
        if ($lt === 'vip' || $lt === 'featured') {
            http_response_code(403);
            echo json_encode(['error' => 'VIP/Онцгой зар олгох эрх зөвхөн админд'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $existingLt = normalize_listing_type_value($existing['listing_type'] ?? 'regular');
    if (($existingLt === 'vip' || $existingLt === 'featured') && array_key_exists('listing_type_expires', $payload)) {
        $demoting = array_key_exists('listing_type', $payload)
            && normalize_listing_type_value($payload['listing_type']) === 'regular';
        if (!$demoting) {
            http_response_code(403);
            echo json_encode(['error' => 'VIP/Онцгой зарын хугацааг зөвхөн админ сунгаж болно'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
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

/**
 * MySQL users.id — бүртгэлийн тогтмол дугаар (customer_id гэж API-д буцаана).
 */
function get_user_customer_id_by_firebase_uid(PDO $pdo, string $firebaseUid): ?int
{
    if ($firebaseUid === '' || !table_has($pdo, 'users', 'firebase_uid')) {
        return null;
    }
    try {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE firebase_uid = :uid LIMIT 1');
        $stmt->execute([':uid' => $firebaseUid]);
        $row = $stmt->fetch();
        if (!$row || !isset($row['id'])) {
            return null;
        }

        return (int) $row['id'];
    } catch (Throwable $e) {
        return null;
    }
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

/**
 * @param array<string,mixed> $body
 */
function upsert_user_profile_best_effort(PDO $pdo, string $firebaseUid, ?string $email, array $body): void
{
    if ($firebaseUid === '') return;
    try {
        $displayName = isset($body['display_name']) ? trim((string) $body['display_name']) : null;
        if ($displayName === '') $displayName = null;
        if ($displayName === null && isset($body['displayName'])) {
            $displayName = trim((string) $body['displayName']);
            if ($displayName === '') $displayName = null;
        }
        $phone = isset($body['phone']) ? trim((string) $body['phone']) : null;
        if ($phone === '') $phone = null;
        $city = isset($body['city']) ? trim((string) $body['city']) : null;
        if ($city === '') $city = null;
        $district = isset($body['district']) ? trim((string) $body['district']) : null;
        if ($district === '') $district = null;

        upsert_user_best_effort($pdo, $firebaseUid, $email);

        if (!table_has($pdo, 'users', 'firebase_uid')) {
            return;
        }
        $stmt = $pdo->prepare('SELECT id FROM users WHERE firebase_uid = :uid LIMIT 1');
        $stmt->execute([':uid' => $firebaseUid]);
        $row = $stmt->fetch();
        if (!$row || !isset($row['id'])) return;
        $id = (string) $row['id'];

        $set = [];
        $params = [':id' => $id];
        if (table_has($pdo, 'users', 'email') && $email !== null) {
            $set[] = 'email = :email';
            $params[':email'] = $email;
        }
        if (table_has($pdo, 'users', 'display_name') && $displayName !== null) {
            $set[] = 'display_name = :display_name';
            $params[':display_name'] = $displayName;
        }
        if (table_has($pdo, 'users', 'phone')) {
            $set[] = 'phone = :phone';
            $params[':phone'] = $phone;
        }
        if (table_has($pdo, 'users', 'city')) {
            $set[] = 'city = :city';
            $params[':city'] = $city;
        }
        if (table_has($pdo, 'users', 'district')) {
            $set[] = 'district = :district';
            $params[':district'] = $district;
        }
        if (table_has($pdo, 'users', 'updated_at')) {
            $set[] = 'updated_at = NOW()';
        }
        if (!$set) return;
        $sql = 'UPDATE users SET ' . implode(', ', $set) . ' WHERE id = :id';
        $u = $pdo->prepare($sql);
        $u->execute($params);
    } catch (Throwable $e) {
        // best effort only
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
