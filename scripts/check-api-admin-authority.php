<?php
declare(strict_types=1);

/**
 * Focused authorization harness for api/index.php.
 *
 * Before the fix:
 *   php scripts/check-api-admin-authority.php --expect-vulnerable
 * After the fix:
 *   php scripts/check-api-admin-authority.php
 */

function extract_function_source(string $source, string $name): ?string
{
    $tokens = token_get_all($source);
    $capturing = false;
    $candidate = false;
    $buffer = '';
    $braceDepth = 0;
    $sawBrace = false;

    foreach ($tokens as $token) {
        $text = is_array($token) ? $token[1] : $token;
        $id = is_array($token) ? $token[0] : null;

        if (!$capturing && $id === T_FUNCTION) {
            $candidate = true;
            $buffer = $text;
            continue;
        }
        if ($candidate && !$capturing) {
            $buffer .= $text;
            if ($id === T_STRING) {
                if ($text !== $name) {
                    $candidate = false;
                    $buffer = '';
                    continue;
                }
                $capturing = true;
            }
            continue;
        }
        if (!$capturing) {
            continue;
        }

        $buffer .= $text;
        if ($text === '{') {
            $braceDepth++;
            $sawBrace = true;
        } elseif ($text === '}') {
            $braceDepth--;
            if ($sawBrace && $braceDepth === 0) {
                return $buffer;
            }
        }
    }

    return null;
}

function table_has(PDO $pdo, string $table, string $column): bool
{
    if ($table !== 'users') {
        return false;
    }
    $columns = $pdo->query('PRAGMA table_info(users)')->fetchAll(PDO::FETCH_ASSOC);
    return in_array($column, array_column($columns, 'name'), true);
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

$source = file_get_contents(__DIR__ . '/../api/index.php');
if (!is_string($source)) {
    throw new RuntimeException('Unable to read api/index.php');
}

$requiredFunctions = [
    'normalize_admin_role',
    'fetch_user_admin_scope_row',
    'get_app_admin_scope',
];
$optionalFunctions = [
    'normalize_admin_scope',
    'admin_scopes_match',
    'firebase_verified_token_context',
    'firestore_admin_scope_from_document',
];
foreach (array_merge($requiredFunctions, $optionalFunctions) as $functionName) {
    $functionSource = extract_function_source($source, $functionName);
    if ($functionSource === null) {
        if (in_array($functionName, $requiredFunctions, true)) {
            throw new RuntimeException("Missing function {$functionName}");
        }
        continue;
    }
    eval($functionSource);
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec(
    'CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        firebase_uid TEXT,
        email TEXT,
        role TEXT,
        admin_country_code TEXT,
        admin_region_code TEXT
    )'
);
$pdo->exec(
    "INSERT INTO users (firebase_uid, email, role)
     VALUES ('actor-uid', 'actor@example.invalid', 'super_admin')"
);
$authUser = [
    'uid' => 'actor-uid',
    'email' => 'actor@example.invalid',
    'idToken' => 'verified-token-placeholder',
    'projectId' => 'demo-project',
];
$supportsFirestoreAuthority = (new ReflectionFunction('get_app_admin_scope'))->getNumberOfParameters() >= 3;

if ($supportsFirestoreAuthority) {
    $staleResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'user',
        'country_code' => null,
        'region_code' => null,
    ]);
    $unavailableResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): ?array => null);
    $matchingResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'super_admin',
        'country_code' => null,
        'region_code' => null,
    ]);
    $pdo->exec(
        "UPDATE users
         SET role = 'country_admin', admin_country_code = 'US'
         WHERE firebase_uid = 'actor-uid'"
    );
    $scopeMismatchResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'country_admin',
        'country_code' => 'KR',
        'region_code' => null,
    ]);
    $matchingCountryResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'country_admin',
        'country_code' => 'US',
        'region_code' => null,
    ]);
    $pdo->exec(
        "UPDATE users
         SET role = 'region_admin', admin_country_code = 'US', admin_region_code = 'washington-dc'
         WHERE firebase_uid = 'actor-uid'"
    );
    $matchingRegionResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'region_admin',
        'country_code' => 'US',
        'region_code' => 'washington-dc',
    ]);
    $regionMismatchResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'region_admin',
        'country_code' => 'US',
        'region_code' => 'chicago',
    ]);
} else {
    $staleResult = get_app_admin_scope($pdo, $authUser);
    $unavailableResult = null;
    $matchingResult = null;
    $scopeMismatchResult = null;
    $matchingCountryResult = null;
    $matchingRegionResult = null;
    $regionMismatchResult = null;
}

$pdo->exec("DELETE FROM users WHERE firebase_uid = 'actor-uid'");
putenv('APP_ADMIN_UIDS=actor-uid');
if ($supportsFirestoreAuthority) {
    $envDemotedResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'user',
        'country_code' => null,
        'region_code' => null,
    ]);
    $envMatchingResult = get_app_admin_scope($pdo, $authUser, static fn(array $user): array => [
        'role' => 'super_admin',
        'country_code' => null,
        'region_code' => null,
    ]);
} else {
    $envDemotedResult = get_app_admin_scope($pdo, $authUser);
    $envMatchingResult = null;
}
putenv('APP_ADMIN_UIDS');

$tokenContext = null;
$wrongSubjectContext = null;
$invalidAudienceContext = null;
$parsedFirestoreScope = null;
$verificationRetainsToken = false;
if (function_exists('firebase_verified_token_context')) {
    $payload = json_encode([
        'aud' => 'demo-project',
        'iss' => 'https://securetoken.google.com/demo-project',
        'sub' => 'actor-uid',
    ], JSON_UNESCAPED_SLASHES);
    $token = base64url_encode('{"alg":"RS256","typ":"JWT"}')
        . '.' . base64url_encode((string) $payload)
        . '.signature';
    $tokenContext = firebase_verified_token_context($token, 'actor-uid');
    $wrongSubjectContext = firebase_verified_token_context($token, 'different-uid');
    $invalidPayload = json_encode([
        'aud' => '../wrong/project',
        'iss' => 'https://securetoken.google.com/../wrong/project',
        'sub' => 'actor-uid',
    ], JSON_UNESCAPED_SLASHES);
    $invalidToken = base64url_encode('{"alg":"RS256","typ":"JWT"}')
        . '.' . base64url_encode((string) $invalidPayload)
        . '.signature';
    $invalidAudienceContext = firebase_verified_token_context($invalidToken, 'actor-uid');
    $verifySource = extract_function_source($source, 'verify_firebase_bearer_token') ?? '';
    $lookupCheckPos = strpos($verifySource, "isset(\$json['users'][0]['localId'])");
    $contextPos = strpos($verifySource, 'firebase_verified_token_context');
    $verificationRetainsToken = $lookupCheckPos !== false
        && $contextPos !== false
        && $lookupCheckPos < $contextPos
        && strpos($verifySource, "'idToken'") !== false
        && strpos($verifySource, "'projectId'") !== false;
}
if (function_exists('firestore_admin_scope_from_document')) {
    $parsedFirestoreScope = firestore_admin_scope_from_document([
        'fields' => [
            'role' => ['stringValue' => 'region_admin'],
            'admin_country_code' => ['stringValue' => 'US'],
            'admin_region_code' => ['stringValue' => 'washington-dc'],
        ],
    ]);
}

$expectVulnerable = in_array('--expect-vulnerable', $argv, true);
$checks = $expectVulnerable
    ? [
        'stale_mysql_authorizes_demoted_actor' => ($staleResult['role'] ?? null) === 'super_admin',
        'app_admin_uids_bypasses_current_role' => ($envDemotedResult['role'] ?? null) === 'super_admin',
        'verified_token_context_is_discarded' => !$verificationRetainsToken,
    ]
    : [
        'stale_mysql_is_denied' => $staleResult === null,
        'firestore_unavailable_is_denied' => $unavailableResult === null,
        'matching_super_admin_is_allowed' => ($matchingResult['role'] ?? null) === 'super_admin',
        'scope_mismatch_is_denied' => $scopeMismatchResult === null,
        'matching_country_scope_is_allowed' => ($matchingCountryResult['country_code'] ?? null) === 'US',
        'matching_region_scope_is_allowed' => ($matchingRegionResult['region_code'] ?? null) === 'washington-dc',
        'region_mismatch_is_denied' => $regionMismatchResult === null,
        'stale_env_admin_is_denied' => $envDemotedResult === null,
        'matching_env_super_admin_is_allowed' => ($envMatchingResult['role'] ?? null) === 'super_admin',
        'verified_token_and_project_are_retained' => $verificationRetainsToken
            && ($tokenContext['projectId'] ?? null) === 'demo-project',
        'token_subject_mismatch_is_rejected' => $wrongSubjectContext === null,
        'unsafe_token_audience_is_rejected' => $invalidAudienceContext === null,
        'firestore_typed_fields_are_parsed' => ($parsedFirestoreScope['role'] ?? null) === 'region_admin'
            && ($parsedFirestoreScope['country_code'] ?? null) === 'US'
            && ($parsedFirestoreScope['region_code'] ?? null) === 'washington-dc',
    ];

foreach ($checks as $name => $passed) {
    if (!$passed) {
        fwrite(STDERR, "FAIL {$name}\n");
        exit(1);
    }
    fwrite(STDOUT, "PASS {$name}\n");
}
