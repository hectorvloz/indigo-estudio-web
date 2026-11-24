<?php
// Utilidades compartidas para agendar asesorías con Google Calendar + Meet.
declare(strict_types=1);

const TIMEZONE = 'America/Bogota';
const SLOT_MINUTES = 30;
const BUFFER_MINUTES = 15;
const DAY_START = '09:00';
const LAST_START = '16:30';
const WORK_DAYS = [1, 2, 3, 4, 5]; // lunes a viernes
const DAYS_AHEAD = 14;
// Horas que Indigo no ofrece (temprano, almuerzo, tarde). Se muestran como no disponibles.
const DEFAULT_BLOCKED = ['09:00', '12:00', '12:30', '16:30'];

function blocked_times(): array
{
    return config()['blocked_times'] ?? DEFAULT_BLOCKED;
}

function config(): array
{
    static $config = null;
    if ($config !== null) return $config;
    $candidates = array_filter([
        getenv('INDIGO_ASESORIA_CONFIG') ?: null,
        dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__) . '/indigo-config/asesoria.php',
        dirname(__DIR__, 3) . '/indigo-config/asesoria.php',
    ]);
    foreach ($candidates as $path) {
        if (is_readable($path)) return $config = require $path;
    }
    fail(503, 'La agenda no está configurada todavía.');
}

function json_out(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $message): void
{
    json_out(['ok' => false, 'error' => $message], $status);
}

function http_post(string $url, array $headers, string $body): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$status, json_decode((string) $raw, true) ?: []];
}

/**
 * Envía un evento Lead a Meta Conversions API.
 * Los datos personales van normalizados y cifrados con SHA-256, como exige Meta.
 * Config: meta_pixel_id, meta_capi_token y, opcionales, meta_api_version (v26.0) y meta_test_event_code.
 */
function send_meta_lead(array $c, array $lead): void
{
    $hash = fn(string $v) => hash('sha256', $v);
    $digits = preg_replace('/\D/', '', $lead['phone']);
    if (strlen($digits) === 10 && $digits[0] === '3') $digits = '57' . $digits; // celular colombiano sin indicativo
    $first = mb_strtolower(trim(explode(' ', trim($lead['name']))[0] ?? ''), 'UTF-8');

    $fbp = (string) ($_COOKIE['_fbp'] ?? '');
    $fbc = (string) ($_COOKIE['_fbc'] ?? '');
    if ($fbc === '' && $lead['fbclid'] !== '') $fbc = 'fb.1.' . (int) (microtime(true) * 1000) . '.' . $lead['fbclid'];

    $userData = array_filter([
        'em' => [$hash(mb_strtolower(trim($lead['email']), 'UTF-8'))],
        'ph' => $digits !== '' ? [$hash($digits)] : null,
        'fn' => $first !== '' ? [$hash($first)] : null,
        'country' => [$hash('co')],
        'client_ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'fbp' => $fbp !== '' ? $fbp : null,
        'fbc' => $fbc !== '' ? $fbc : null,
    ], fn($v) => $v !== null && $v !== '');

    $referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    $origins = $c['allowed_origins'] ?? ['https://estudioindigo.com.co'];
    $sourceUrl = $referer !== '' && array_filter($origins, fn($o) => strncmp($referer, $o, strlen($o)) === 0) ? $referer : 'https://estudioindigo.com.co/asesoria/';

    $body = [
        'data' => [[
            'event_name' => 'Lead',
            'event_time' => time(),
            'event_id' => $lead['event_id'],
            'action_source' => 'website',
            'event_source_url' => $sourceUrl,
            'user_data' => $userData,
            'custom_data' => ['content_name' => 'Asesoría web gratis', 'content_category' => $lead['webType']],
        ]],
        'access_token' => $c['meta_capi_token'],
    ];
    if (!empty($c['meta_test_event_code'])) $body['test_event_code'] = $c['meta_test_event_code'];

    $version = $c['meta_api_version'] ?? 'v26.0';
    [$status, $resp] = http_post(
        'https://graph.facebook.com/' . $version . '/' . rawurlencode((string) $c['meta_pixel_id']) . '/events',
        ['Content-Type: application/json', 'Accept: application/json'],
        json_encode($body, JSON_UNESCAPED_UNICODE)
    );
    if ($status < 200 || $status >= 300) error_log('asesoria: meta capi error ' . $status . ' ' . ($resp['error']['message'] ?? ''));
}

function access_token(): string
{
    $c = config();
    [$status, $data] = http_post('https://oauth2.googleapis.com/token', ['Content-Type: application/x-www-form-urlencoded'], http_build_query([
        'client_id' => $c['client_id'],
        'client_secret' => $c['client_secret'],
        'refresh_token' => $c['refresh_token'],
        'grant_type' => 'refresh_token',
    ]));
    if ($status !== 200 || empty($data['access_token'])) {
        error_log('asesoria: token error ' . $status);
        fail(502, 'No pudimos conectar con la agenda. Intenta de nuevo en un momento.');
    }
    return $data['access_token'];
}

function google(string $path, array $payload, string $token): array
{
    return http_post('https://www.googleapis.com/calendar/v3' . $path, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ], json_encode($payload));
}

/** Intervalos ocupados del calendario, ampliados con el margen entre citas. */
function busy_intervals(DateTimeImmutable $from, DateTimeImmutable $to, string $token): array
{
    $calendar = config()['calendar_id'] ?? 'primary';
    [$status, $data] = google('/freeBusy', [
        'timeMin' => $from->format(DATE_RFC3339),
        'timeMax' => $to->format(DATE_RFC3339),
        'timeZone' => TIMEZONE,
        'items' => [['id' => $calendar]],
    ], $token);
    if ($status !== 200) fail(502, 'No pudimos leer la agenda. Intenta de nuevo en un momento.');
    $busy = [];
    foreach ($data['calendars'][$calendar]['busy'] ?? [] as $b) {
        $busy[] = [
            (new DateTimeImmutable($b['start']))->modify('-' . BUFFER_MINUTES . ' minutes'),
            (new DateTimeImmutable($b['end']))->modify('+' . BUFFER_MINUTES . ' minutes'),
        ];
    }
    return $busy;
}

/** Todos los inicios posibles según el horario, sin mirar el calendario. */
function candidate_slots(DateTimeImmutable $now): array
{
    $tz = new DateTimeZone(TIMEZONE);
    $day = $now->setTimezone($tz)->setTime(0, 0)->modify('+1 day');
    $slots = [];
    for ($i = 0; $i < DAYS_AHEAD; $i++, $day = $day->modify('+1 day')) {
        if (!in_array((int) $day->format('N'), WORK_DAYS, true)) continue;
        [$h, $m] = array_map('intval', explode(':', DAY_START));
        [$lh, $lm] = array_map('intval', explode(':', LAST_START));
        $t = $day->setTime($h, $m);
        $last = $day->setTime($lh, $lm);
        while ($t <= $last) {
            $slots[] = $t;
            $t = $t->modify('+' . SLOT_MINUTES . ' minutes');
        }
    }
    return $slots;
}

function slot_is_free(DateTimeImmutable $start, array $busy): bool
{
    $end = $start->modify('+' . SLOT_MINUTES . ' minutes');
    foreach ($busy as [$bs, $be]) {
        if ($start < $be && $end > $bs) return false;
    }
    return true;
}

function require_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = config()['allowed_origins'] ?? ['https://estudioindigo.com.co'];
    if ($origin !== '' && !in_array($origin, $allowed, true)) fail(403, 'Origen no permitido.');
}

function rate_limit(string $key, int $max, int $seconds): void
{
    $dir = dirname(config()['leads_file'] ?? (sys_get_temp_dir() . '/x')) ;
    $file = $dir . '/rate-' . hash('sha256', $key) . '.json';
    $now = time();
    $hits = is_readable($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
    $hits = array_values(array_filter($hits, fn($t) => $t > $now - $seconds));
    if (count($hits) >= $max) fail(429, 'Has intentado varias veces. Escríbenos por WhatsApp y te ayudamos.');
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
}
