<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

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

$clientCode = clean_text($input['code'] ?? '', 40);
$code = preg_match('/^GABU-\d{4}-[A-Z0-9]{4,12}$/', $clientCode) ? $clientCode : make_code();

$participant = [
    'code' => $code,
    'fullName' => $fullName,
    'phone' => $phone,
    'email' => $email,
    'city' => clean_text($input['city'] ?? '', 100),
    'guests' => max(1, min(50, (int) ($input['guests'] ?? 1))),
    'contribution' => normalize_amount($input['contribution'] ?? 0),
    'paymentStatus' => clean_text($input['paymentStatus'] ?? 'Prometido', 80),
    'note' => clean_text($input['note'] ?? '', 500),
    'checkedInAt' => '',
    'createdAt' => date(DATE_ATOM),
];

$participants = read_participants();
$participants[] = $participant;

write_participants($participants);

json_response([
    'participant' => $participant,
    'participants' => $participants,
], 201);
