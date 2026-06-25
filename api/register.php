<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

check_rate_limit('register:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 20, 60);

$input = validate_json_request();

$fullName = clean_text($input['fullName'] ?? '', 120);
$phone = clean_text($input['phone'] ?? '', 80);

if ($fullName === '' || $phone === '') {
    json_response(['error' => 'Nome e contacto são obrigatórios.'], 422);
}

// Validar email se fornecido
$email = clean_text($input['email'] ?? '', 120);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Email inválido.'], 422);
}

$confirmEmail = clean_text($input['confirmEmail'] ?? '', 120);
if ($email !== '' && $confirmEmail !== '' && strcasecmp($email, $confirmEmail) !== 0) {
    json_response(['error' => 'Email e confirmação de email não coincidem.'], 422);
}

$clientCode = clean_text($input['code'] ?? '', 40);
$code = preg_match('/^GABU-\d{4}-[A-Z0-9]{4,12}$/', $clientCode) ? $clientCode : make_code();

$participant = normalize_participant([
    'code' => $code,
    'fullName' => $fullName,
    'phone' => $phone,
    'email' => $email,
    'city' => clean_text($input['city'] ?? '', 100),
    'activityName' => clean_text($input['activityName'] ?? 'Atividade geral', 120),
    'guests' => max(1, min(50, (int) ($input['guests'] ?? 1))),
    'contribution' => normalize_amount($input['contribution'] ?? 0),
    'agreedAmount' => normalize_amount($input['contribution'] ?? 0),
    'amountConfirmed' => false,
    'amountConfirmedAt' => '',
    'paymentStatus' => 'Aguardando confirmação do organizador',
    'note' => clean_text($input['note'] ?? '', 500),
    'checkedInAt' => '',
]);

$participants = read_participants();
$participants[] = $participant;

write_participants($participants);

json_response([
    'participant' => $participant,
    'participants' => $participants,
], 201);
