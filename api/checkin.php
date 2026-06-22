<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

require_admin();

$input = validate_json_request();
$code = clean_text($input['code'] ?? '', 40);

if ($code === '') {
    json_response(['error' => 'Código obrigatório.'], 422);
}

$checkedInAt = clean_text($input['checkedInAt'] ?? '', 80);

if ($checkedInAt !== '') {
    $timestamp = strtotime($checkedInAt);
    $checkedInAt = $timestamp === false ? date(DATE_ATOM) : date(DATE_ATOM, $timestamp);
}

$participants = read_participants();
$foundIndex = null;

foreach ($participants as $index => $participant) {
    if (($participant['code'] ?? '') === $code) {
        $foundIndex = $index;
        break;
    }
}

if ($foundIndex === null) {
    json_response(['error' => 'Participante não encontrado.'], 404);
}

$participants[$foundIndex]['checkedInAt'] = $checkedInAt;

write_participants($participants);

json_response([
    'participant' => $participants[$foundIndex],
    'participants' => $participants,
]);
