<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $hasOwner = count(read_organizers()) > 0;
    json_response([
        'needsBootstrap' => !$hasOwner,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

enforce_admin_ip_access();

$existing = read_organizers();
if (count($existing) > 0) {
    json_response(['error' => 'Bootstrap já concluído.'], 409);
}

check_rate_limit('bootstrap-owner:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 10, 60);
$input = validate_json_request();

$username = organizer_username_key($input['username'] ?? '');
$name = clean_text($input['name'] ?? '', 120);
$pin = clean_text($input['pin'] ?? '', 80);

if ($username === '' || strlen($username) < 3) {
    json_response(['error' => 'Utilizador inválido.'], 422);
}

if (strlen($pin) < 6 || preg_match('/[a-z]/i', $pin) !== 1 || preg_match('/\d/', $pin) !== 1) {
    json_response(['error' => 'Senha fraca. Use pelo menos 6 caracteres com letras e números.'], 422);
}

$now = date(DATE_ATOM);
$owner = [
    'id' => 'org-' . substr(md5($username . $now), 0, 12),
    'name' => $name !== '' ? $name : $username,
    'username' => $username,
    'role' => 'admin',
    'allowedActivities' => [],
    'active' => true,
    'mustChangePassword' => false,
    'pinHash' => hash_organizer_pin($pin),
    'pinChangedAt' => $now,
    'createdAt' => $now,
    'updatedAt' => $now,
];

write_organizers([$owner]);
append_audit_log('bootstrap_owner', '', ['username' => $username]);

json_response([
    'created' => true,
    'owner' => public_organizer_profile($owner),
], 201);
