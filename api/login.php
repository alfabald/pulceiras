<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

// Rate limiting para proteção contra brute force
check_rate_limit($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1', 5, 60);

$input = validate_json_request();
$pin = clean_text($input['pin'] ?? '', 80);

if ($pin === '') {
    json_response(['error' => 'Senha é obrigatória.'], 422);
}

if (!verify_admin_pin($pin)) {
    json_response(['error' => 'Senha incorreta.'], 401);
}

start_admin_session();
session_regenerate_id(true);
$_SESSION['is_admin'] = true;

json_response([
    'isAdmin' => true,
]);
