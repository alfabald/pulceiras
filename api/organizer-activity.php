<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

if (!is_admin()) {
    json_response(['error' => 'Precisas entrar como organizador.'], 401);
}

if (!admin_ip_allowed()) {
    json_response(['error' => 'Acesso administrativo bloqueado para este IP.'], 403);
}

check_rate_limit('organizer-activity:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 50, 60);

$username = current_admin_username();
if ($username === '') {
    json_response(['error' => 'Utilizador de sessão inválido.'], 401);
}

$organizers = read_organizers();
$index = -1;
for ($i = 0; $i < count($organizers); $i++) {
    if (($organizers[$i]['username'] ?? '') === $username) {
        $index = $i;
        break;
    }
}

if ($index < 0) {
    json_response(['error' => 'Organizador não encontrado.'], 404);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response([
        'organizer' => public_organizer_profile($organizers[$index]),
        'activityProfile' => normalize_organizer_activity_profile($organizers[$index]['activityProfile'] ?? []),
    ]);
}

$input = validate_json_request();
$profile = normalize_organizer_activity_profile($input['activityProfile'] ?? []);
$organizers[$index]['activityProfile'] = $profile;
$organizers[$index]['updatedAt'] = date(DATE_ATOM);

write_organizers($organizers);
append_audit_log('organizer_activity_update', '', ['username' => $username]);

json_response([
    'saved' => true,
    'organizer' => public_organizer_profile($organizers[$index]),
    'activityProfile' => $profile,
]);
