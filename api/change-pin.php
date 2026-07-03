<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

if (!is_admin()) {
    json_response(['error' => 'Sem sessão ativa.'], 401);
}

$username = current_admin_username();
if ($username === '') {
    json_response(['error' => 'A troca de senha está disponível apenas para contas de organizador com utilizador.'], 422);
}

check_rate_limit('change-pin:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 20, 60);
$input = validate_json_request();
$currentPin = clean_text($input['currentPin'] ?? '', 80);
$newPin = clean_text($input['newPin'] ?? '', 80);

if ($currentPin === '' || $newPin === '') {
    json_response(['error' => 'Senha atual e nova senha são obrigatórias.'], 422);
}

if (strlen($newPin) < 6 || preg_match('/[a-z]/i', $newPin) !== 1 || preg_match('/\d/', $newPin) !== 1) {
    json_response(['error' => 'Senha fraca. Use pelo menos 6 caracteres com letras e números.'], 422);
}

$account = verify_organizer_credentials($username, $currentPin);
if (count($account) === 0) {
    json_response(['error' => 'Senha atual inválida.'], 401);
}

$organizers = read_organizers();
$updated = null;
foreach ($organizers as $index => $organizer) {
    if (($organizer['username'] ?? '') !== $username) {
        continue;
    }

    $organizers[$index]['pinHash'] = hash_organizer_pin($newPin);
    $organizers[$index]['mustChangePassword'] = false;
    $organizers[$index]['pinChangedAt'] = date(DATE_ATOM);
    $organizers[$index]['updatedAt'] = date(DATE_ATOM);
    $updated = $organizers[$index];
    break;
}

if (!is_array($updated)) {
    json_response(['error' => 'Conta do organizador não encontrada.'], 404);
}

write_organizers($organizers);
$_SESSION['requiresPinChange'] = false;

append_audit_log('organizer_change_own_pin', '', ['username' => $username]);

json_response([
    'updated' => true,
    'requiresPinChange' => false,
]);
