<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

require_permission('confirmEntry');
check_rate_limit('checkin:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 40, 60);

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

if (!admin_participant_in_scope($participants[$foundIndex])) {
    json_response(['error' => 'Participante não encontrado.'], 404);
}

$isTryingCheckin = $checkedInAt !== '';
if ($isTryingCheckin && !bool_value($participants[$foundIndex]['amountConfirmed'] ?? false)) {
    json_response(['error' => 'Passe ainda não válido. Confirma o montante com o organizador primeiro.'], 422);
}

if ($isTryingCheckin && !empty($participants[$foundIndex]['checkedInAt'])) {
    $visibleParticipants = filter_participants_for_admin_scope($participants);
    json_response([
        'participant' => $participants[$foundIndex],
        'participants' => $visibleParticipants,
        'alreadyCheckedIn' => true,
        'message' => 'Entrada já confirmada anteriormente.',
    ]);
}

$participants[$foundIndex]['checkedInAt'] = $checkedInAt;
$participants[$foundIndex]['updatedAt'] = date(DATE_ATOM);

write_participants($participants);

append_audit_log($checkedInAt === '' ? 'checkin_undo' : 'checkin_confirm', $code, [
    'checkedInAt' => $checkedInAt,
]);

$visibleParticipants = filter_participants_for_admin_scope($participants);

json_response([
    'participant' => $participants[$foundIndex],
    'participants' => $visibleParticipants,
]);
