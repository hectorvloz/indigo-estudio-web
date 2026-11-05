<?php
// Agenda la asesoría: crea el evento con Google Meet, invita al cliente y avisa a Indigo.
declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Método no permitido.');
require_same_origin();

$in = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($in)) fail(400, 'Datos inválidos.');
if (!empty($in['website'])) json_out(['ok' => true]); // honeypot: los bots no ven este campo

$clean = fn($v, int $max) => trim(mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string) ($v ?? '')), 0, $max));
$name = $clean($in['name'] ?? '', 80);
$email = filter_var(trim((string) ($in['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '';
$phone = preg_replace('/[^\d+ ]/', '', $clean($in['phone'] ?? '', 25));
$brand = $clean($in['brand'] ?? '', 80);
$webType = $clean($in['webType'] ?? '', 40);
$notes = $clean($in['notes'] ?? '', 500);
$consent = ($in['consent'] ?? false) === true;
$source = is_array($in['source'] ?? null) ? array_map(fn($v) => $clean($v, 120), array_slice($in['source'], 0, 8)) : [];

$types = ['Landing', 'Página empresarial', 'Tienda virtual', 'A la medida', 'Todavía no sé'];
if ($name === '' || $email === '' || strlen(preg_replace('/\D/', '', $phone)) < 7) fail(422, 'Revisa tu nombre, correo y WhatsApp.');
if (!$consent) fail(422, 'Necesitamos tu autorización para agendar.');
if ($brand === '' || !in_array($webType, $types, true)) fail(422, 'Cuéntanos el nombre de tu marca y qué web buscas.');

rate_limit('book:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 5, 3600);

$tz = new DateTimeZone(TIMEZONE);
$start = DateTimeImmutable::createFromFormat('Y-m-d H:i', (string) ($in['date'] ?? '') . ' ' . (string) ($in['time'] ?? ''), $tz);
if (!$start) fail(422, 'Escoge un día y una hora.');
$valid = array_filter(candidate_slots(new DateTimeImmutable('now', $tz)), fn($s) => $s == $start);
if (!$valid || in_array($start->format('H:i'), blocked_times(), true)) fail(422, 'Ese horario ya no está disponible. Escoge otro.');

$token = access_token();
$busy = busy_intervals($start->modify('-1 hour'), $start->modify('+2 hours'), $token);
if (!slot_is_free($start, $busy)) fail(409, 'Alguien acaba de tomar ese horario. Escoge otro, porfa.');

$end = $start->modify('+' . SLOT_MINUTES . ' minutes');
$calendar = config()['calendar_id'] ?? 'primary';
$sourceText = $source ? "\nOrigen: " . implode(' · ', array_map(fn($k, $v) => "$k=$v", array_keys($source), $source)) : '';
$description = "Asesoría gratis para sitio web.\n\nNombre: $name\nMarca: $brand\nTipo de web: $webType\nWhatsApp: $phone\nCorreo: $email" . ($notes !== '' ? "\nNotas: $notes" : '') . $sourceText;

[$status, $event] = google('/calendars/' . rawurlencode($calendar) . '/events?conferenceDataVersion=1&sendUpdates=all', [
    'summary' => "Asesoría web gratis · $brand · Indigo",
    'description' => $description,
    'start' => ['dateTime' => $start->format(DATE_RFC3339), 'timeZone' => TIMEZONE],
    'end' => ['dateTime' => $end->format(DATE_RFC3339), 'timeZone' => TIMEZONE],
    'attendees' => [['email' => $email, 'displayName' => $name]],
    'conferenceData' => ['createRequest' => ['requestId' => bin2hex(random_bytes(12)), 'conferenceSolutionKey' => ['type' => 'hangoutsMeet']]],
    'reminders' => ['useDefault' => false, 'overrides' => [['method' => 'email', 'minutes' => 60], ['method' => 'popup', 'minutes' => 10]]],
], $token);
if ($status !== 200) {
    error_log('asesoria: event error ' . $status);
    fail(502, 'No pudimos agendar. Intenta de nuevo o escríbenos por WhatsApp.');
}
$meet = $event['hangoutLink'] ?? '';

$when = $start->format('Y-m-d H:i');
$c = config();
$owner = $c['notify_email'] ?? 'hola@estudioindigo.com.co';
$subject = '=?UTF-8?B?' . base64_encode("Nueva asesoría: $brand · $when") . '?=';
$body = "Se agendó una asesoría.\n\nFecha: $when (hora Colombia)\nMeet: $meet\n\n$description\n";
$headers = implode("\r\n", [
    'From: Indigo Agenda <' . ($c['from_email'] ?? 'agenda@estudioindigo.com.co') . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
]);
@mail($owner, $subject, $body, $headers);

if (!empty($c['leads_file'])) {
    @file_put_contents($c['leads_file'], json_encode([
        'created' => (new DateTimeImmutable('now', $tz))->format(DATE_RFC3339),
        'start' => $start->format(DATE_RFC3339),
        'name' => $name, 'email' => $email, 'phone' => $phone, 'brand' => $brand,
        'webType' => $webType, 'notes' => $notes, 'source' => $source, 'meet' => $meet,
    ], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

// Envía el lead a Infocus CRM. Si falla, la reserva sigue siendo válida: queda en el log y en leads.jsonl.
if (!empty($c['infocus_url']) && !empty($c['infocus_token'])) {
    [$crmStatus] = http_post(rtrim($c['infocus_url'], '/') . '/webhooks/leads', [
        'Authorization: Bearer ' . $c['infocus_token'],
        'Content-Type: application/json',
        'Accept: application/json',
    ], json_encode([
        'nombre' => $name, 'email' => $email, 'telefono' => $phone, 'marca' => $brand,
        'tipo_web' => $webType, 'origen' => 'Landing asesoría', 'utm' => (object) $source,
        'reunion' => ['inicio' => $start->format(DATE_RFC3339), 'duracion_min' => SLOT_MINUTES, 'meet_link' => $meet ?: null, 'google_event_id' => $event['id'] ?? null],
    ], JSON_UNESCAPED_UNICODE));
    if ($crmStatus < 200 || $crmStatus >= 300) error_log('asesoria: infocus error ' . $crmStatus);
}

json_out(['ok' => true, 'start' => $start->format(DATE_RFC3339), 'meet' => $meet]);
