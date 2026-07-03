<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

require_permission('deleteParticipants');
check_rate_limit('delete:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 30, 60);

$input = validate_json_request();
$code = clean_text($input['code'] ?? '', 40);

if ($code === '') {
    json_response(['error' => 'Código obrigatório.'], 422);
}

$participants = read_participants();
$target = null;
foreach ($participants as $participant) {
    if (($participant['code'] ?? '') === $code) {
        $target = $participant;
        break;
    }
}

if (!is_array($target)) {
    json_response(['error' => 'Participante não encontrado.'], 404);
}

if (!admin_participant_in_scope($target)) {
    json_response(['error' => 'Participante não encontrado.'], 404);
}

$filtered = array_values(array_filter($participants, fn($p) => ($p['code'] ?? '') !== $code));

if (count($filtered) === count($participants)) {
    json_response(['error' => 'Participante não encontrado.'], 404);
}

write_participants($filtered);
append_audit_log('delete_participant', $code);

json_response(['deleted' => true, 'code' => $code]);
