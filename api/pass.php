<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método não permitido.'], 405);
}

check_rate_limit('pass:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 120, 60);

$code = clean_text($_GET['code'] ?? '', 40);
if ($code === '') {
    json_response(['error' => 'Código obrigatório.'], 422);
}

$participants = read_participants();
$participant = null;

foreach ($participants as $item) {
    if (($item['code'] ?? '') === $code) {
        $participant = normalize_participant($item);
        break;
    }
}

if (!$participant) {
    json_response(['error' => 'Passe não encontrado.'], 404);
}

$eventConfig = read_event_config();
$eventName = clean_text($eventConfig['eventName'] ?? 'Evento', 160);
$isValid = bool_value($participant['amountConfirmed'] ?? false);

json_response([
    'eventName' => $eventName,
    'validation' => [
        'isValid' => $isValid,
        'message' => $isValid
            ? 'QR válido para o evento configurado.'
            : 'QR inválido: passe ainda não foi validado pelo organizador.',
    ],
    'participant' => [
        'code' => $participant['code'],
        'fullName' => $participant['fullName'],
        'activityName' => $participant['activityName'],
        'adults' => $participant['adults'],
        'childrenUnder16' => $participant['childrenUnder16'],
        'guests' => $participant['guests'],
        'agreedAmount' => $participant['agreedAmount'],
        'contribution' => $participant['contribution'],
        'paymentStatus' => $participant['paymentStatus'],
        'amountConfirmed' => (bool) $participant['amountConfirmed'],
        'amountConfirmedAt' => $participant['amountConfirmedAt'],
        'checkedInAt' => $participant['checkedInAt'],
    ],
]);
