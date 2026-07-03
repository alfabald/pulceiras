<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

enforce_admin_ip_access();

// Rate limiting para proteção contra brute force
check_rate_limit($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1', 5, 60);

$input = validate_json_request();
$username = organizer_username_key($input['username'] ?? '');
$pin = clean_text($input['pin'] ?? '', 80);

if ($pin === '') {
    json_response(['error' => 'Senha é obrigatória.'], 422);
}

$role = verify_login_role($pin);
$account = [];
if ($username !== '') {
    $account = verify_organizer_credentials($username, $pin);
    if (count($account) > 0) {
        $role = clean_text($account['role'] ?? '', 30);
    } else {
        $role = '';
    }
}

if ($role === '') {
    append_audit_log('login_failed', '', ['reason' => 'invalid_pin']);
    json_response(['error' => 'Senha incorreta.'], 401);
}

start_admin_session();
session_regenerate_id(true);
$_SESSION['is_admin'] = true;
$_SESSION['role'] = $role;
$_SESSION['permissions'] = role_permissions($role);
$_SESSION['allowedActivities'] = count($account) > 0
    ? normalize_organizer_activities($account['allowedActivities'] ?? [])
    : role_allowed_activities($role);
$_SESSION['organizerUsername'] = count($account) > 0
    ? organizer_username_key($account['organizerUsername'] ?? $username)
    : ($role === 'admin' ? owner_username() : '');
$_SESSION['organizerName'] = count($account) > 0
    ? clean_text($account['organizerName'] ?? '', 120)
    : ($role === 'admin' ? 'Admin Principal' : '');
$_SESSION['requiresPinChange'] = count($account) > 0
    ? bool_value($account['requiresPinChange'] ?? false)
    : false;
$_SESSION['fingerprint'] = admin_session_fingerprint();

append_audit_log('login_success', '', [
    'role' => $role,
    'username' => $_SESSION['organizerUsername'] ?? '',
]);

json_response([
    'isAdmin' => true,
    'role' => $role,
    'permissions' => $_SESSION['permissions'],
    'allowedActivities' => $_SESSION['allowedActivities'],
    'organizerUsername' => $_SESSION['organizerUsername'],
    'organizerName' => $_SESSION['organizerName'],
    'requiresPinChange' => $_SESSION['requiresPinChange'],
    'isOwner' => current_admin_is_owner(),
]);
