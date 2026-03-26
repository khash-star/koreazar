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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

require __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? 'health';
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

        case 'listing':
            $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing or invalid id'], JSON_UNESCAPED_UNICODE);
                break;
            }
            $stmt = $pdo->prepare('SELECT * FROM listings WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                break;
            }
            echo json_encode(['data' => map_listing_row($row)], JSON_UNESCAPED_UNICODE);
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
