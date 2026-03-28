<?php
declare(strict_types=1);

/**
 * Контент модераци — үг/хэллэг нь JS-тай ижил (src + mobile/utils/bannedContent.js).
 *
 * Жагсаалт шалгах талбар: зөвхөн extract_listing_payload whitelist-д ордог түлхүүрүүд.
 * (vehicle_*, job_*, contact_name гэх мэтийг одоогийн API хадгалдаггүй тул энд байхгүй;
 *  хэрэглэгчийн талд JS checkBannedListingFields тэдгээрийг шалгана.)
 */

function api_banned_phrases(): array
{
    return [
        'child porn',
        'childporn',
        'underage sex',
        'cp video',
    ];
}

function api_banned_words(): array
{
    return [
        'sex',
        'porn',
        'porno',
        'xxx',
        'nsfw',
        'nude',
        'nudes',
        'erotic',
        'escort',
        'prostitute',
        'prostitution',
        'cocaine',
        'heroin',
        'methamphetamine',
        'scam',
        'scammer',
        'scamming',
        'phishing',
    ];
}

/** extract_listing_payload-ийн текст талбарууд (images биш) */
function api_listing_moderation_string_keys(): array
{
    return [
        'title',
        'description',
        'phone',
        'kakao_id',
        'wechat_id',
        'whatsapp',
        'facebook',
        'location',
        'subcategory',
    ];
}

function api_prohibited_listing_message(): string
{
    return 'Гарчиг, тайлбар эсвэл холбоо барих талбарт зохисгүй үг агуулагдсан байна. Текстээ өөрчилнө үү.';
}

/**
 * @return non-empty-string|null Хориглосон илэрц (дотоод логдолд ашиглана)
 */
function api_find_banned_in_text(string $text): ?string
{
    $normalized = $text;
    if (function_exists('mb_strtolower')) {
        $normalized = mb_strtolower($text, 'UTF-8');
    } else {
        $normalized = strtolower($text);
    }

    foreach (api_banned_phrases() as $phrase) {
        $p = function_exists('mb_strtolower') ? mb_strtolower($phrase, 'UTF-8') : strtolower($phrase);
        if (str_contains($normalized, $p)) {
            return $phrase;
        }
    }

    foreach (api_banned_words() as $word) {
        $pattern = '/\b' . preg_quote($word, '/') . '\b/iu';
        if (preg_match($pattern, $text) === 1) {
            return $word;
        }
    }

    return null;
}

/**
 * @param array<string,mixed> $payload
 */
function api_find_banned_in_listing_payload(array $payload): ?string
{
    $parts = [];
    foreach (api_listing_moderation_string_keys() as $key) {
        if (!array_key_exists($key, $payload)) {
            continue;
        }
        $v = $payload[$key];
        if (is_string($v) && trim($v) !== '') {
            $parts[] = $v;
        }
    }
    if ($parts === []) {
        return null;
    }

    return api_find_banned_in_text(implode("\n", $parts));
}

/** JSON хариу + 400 (дуудагч нь break хийнэ). */
function api_respond_prohibited_listing(): void
{
    http_response_code(400);
    echo json_encode([
        'error' => 'prohibited_content',
        'message' => api_prohibited_listing_message(),
    ], JSON_UNESCAPED_UNICODE);
}
