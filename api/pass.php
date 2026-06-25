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

json_response([
    'participant' => [
        'code' => $participant['code'],
        'fullName' => $participant['fullName'],
        'activityName' => $participant['activityName'],
        'guests' => $participant['guests'],
        'agreedAmount' => $participant['agreedAmount'],
        'contribution' => $participant['contribution'],
        'paymentStatus' => $participant['paymentStatus'],
        'amountConfirmed' => (bool) $participant['amountConfirmed'],
        'amountConfirmedAt' => $participant['amountConfirmedAt'],
        'checkedInAt' => $participant['checkedInAt'],
    ],
]);
