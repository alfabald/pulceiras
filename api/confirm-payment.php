<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

require_permission('confirmPayments');
check_rate_limit('confirm:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 30, 60);

$input = validate_json_request();
$code = clean_text($input['code'] ?? '', 40);

if ($code === '') {
    json_response(['error' => 'Código obrigatório.'], 422);
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

$amount = normalize_amount($input['agreedAmount'] ?? ($participants[$foundIndex]['agreedAmount'] ?? 0));
$proofImage = clean_text($input['paymentProofImage'] ?? '', 400000);
$proofNote = clean_text($input['paymentProofNote'] ?? '', 300);
$participants[$foundIndex]['agreedAmount'] = $amount;
$participants[$foundIndex]['contribution'] = $amount;
$participants[$foundIndex]['amountConfirmed'] = true;
$participants[$foundIndex]['amountConfirmedAt'] = date(DATE_ATOM);
$participants[$foundIndex]['paymentStatus'] = 'Confirmado pelo organizador';
$participants[$foundIndex]['paymentProofImage'] = $proofImage;
$participants[$foundIndex]['paymentProofNote'] = $proofNote;
$participants[$foundIndex]['updatedAt'] = date(DATE_ATOM);

$participants[$foundIndex] = normalize_participant($participants[$foundIndex]);
write_participants($participants);

append_audit_log('confirm_payment', $code, [
    'amount' => $amount,
    'hasProofImage' => $proofImage !== '',
    'proofNote' => $proofNote,
]);

json_response([
    'participant' => $participants[$foundIndex],
    'participants' => $participants,
]);
