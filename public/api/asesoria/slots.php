<?php
// Devuelve los horarios libres para la asesoría, agrupados por día.
declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail(405, 'Método no permitido.');
require_same_origin();

$now = new DateTimeImmutable('now', new DateTimeZone(TIMEZONE));
$slots = candidate_slots($now);
if (!$slots) json_out(['ok' => true, 'days' => []]);

$busy = busy_intervals($slots[0], end($slots)->modify('+1 day'), access_token());

$blocked = blocked_times();
$days = [];
foreach ($slots as $slot) {
    $time = $slot->format('H:i');
    $days[$slot->format('Y-m-d')][] = ['time' => $time, 'free' => !in_array($time, $blocked, true) && slot_is_free($slot, $busy)];
}

$out = [];
foreach ($days as $date => $times) {
    if (array_filter($times, fn($t) => $t['free'])) $out[] = ['date' => $date, 'times' => $times];
}
json_out(['ok' => true, 'timezone' => TIMEZONE, 'minutes' => SLOT_MINUTES, 'days' => $out]);
