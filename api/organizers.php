<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

require_owner_access();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $profiles = array_map('public_organizer_profile', read_organizers());
    json_response([
        'organizers' => $profiles,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

check_rate_limit('organizers:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 40, 60);
$input = validate_json_request();
$action = clean_text($input['action'] ?? '', 30);

$organizers = read_organizers();

$validPin = static function (string $pin): bool {
    if (strlen($pin) < 6) {
        return false;
    }

    return preg_match('/[a-z]/i', $pin) === 1 && preg_match('/\d/', $pin) === 1;
};

if ($action === 'create') {
    $username = organizer_username_key($input['username'] ?? '');
    $name = clean_text($input['name'] ?? '', 120);
    $email = clean_text($input['email'] ?? '', 120);
    $phone = clean_text($input['phone'] ?? '', 80);
    $role = normalize_organizer_role($input['role'] ?? 'viewer');
    $activities = normalize_organizer_activities($input['allowedActivities'] ?? []);
    $pin = clean_text($input['pin'] ?? '', 80);

    if ($username === '' || strlen($username) < 3) {
        json_response(['error' => 'Utilizador inválido.'], 422);
    }
    if (!$validPin($pin)) {
        json_response(['error' => 'Senha fraca. Use pelo menos 6 caracteres com letras e números.'], 422);
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'Email inválido.'], 422);
    }

    if ($phone !== '' && !preg_match('/^[+\d\s\-()]{5,}$/', $phone)) {
        json_response(['error' => 'Telefone inválido.'], 422);
    }

    foreach ($organizers as $item) {
        if (($item['username'] ?? '') === $username) {
            json_response(['error' => 'Já existe organizador com este utilizador.'], 409);
        }
    }

    $now = date(DATE_ATOM);
    $organizer = [
        'id' => 'org-' . substr(md5($username . $now), 0, 12),
        'name' => $name !== '' ? $name : $username,
        'username' => $username,
        'email' => $email,
        'phone' => $phone,
        'role' => $role,
        'allowedActivities' => $activities,
        'active' => true,
        'mustChangePassword' => true,
        'pinHash' => hash_organizer_pin($pin),
        'pinChangedAt' => $now,
        'createdAt' => $now,
        'updatedAt' => $now,
    ];

    $organizers[] = $organizer;
    write_organizers($organizers);
    append_audit_log('organizer_create', '', ['username' => $username, 'role' => $role]);

    json_response(['organizer' => public_organizer_profile($organizer)], 201);
}

if ($action === 'update') {
    $username = organizer_username_key($input['username'] ?? '');
    if ($username === '') {
        json_response(['error' => 'Utilizador obrigatório.'], 422);
    }

    $updated = null;
    foreach ($organizers as $index => $item) {
        if (($item['username'] ?? '') !== $username) {
            continue;
        }

        $organizers[$index]['name'] = clean_text($input['name'] ?? ($item['name'] ?? ''), 120);
        if (array_key_exists('email', $input)) {
            $email = clean_text($input['email'] ?? '', 120);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_response(['error' => 'Email inválido.'], 422);
            }
            $organizers[$index]['email'] = $email;
        }
        if (array_key_exists('phone', $input)) {
            $phone = clean_text($input['phone'] ?? '', 80);
            if ($phone !== '' && !preg_match('/^[+\d\s\-()]{5,}$/', $phone)) {
                json_response(['error' => 'Telefone inválido.'], 422);
            }
            $organizers[$index]['phone'] = $phone;
        }
        $organizers[$index]['role'] = normalize_organizer_role($input['role'] ?? ($item['role'] ?? 'viewer'));
        if (array_key_exists('allowedActivities', $input)) {
            $organizers[$index]['allowedActivities'] = normalize_organizer_activities($input['allowedActivities']);
        }
        if (array_key_exists('active', $input)) {
            $organizers[$index]['active'] = bool_value($input['active']);
        }
        if (array_key_exists('mustChangePassword', $input)) {
            $organizers[$index]['mustChangePassword'] = bool_value($input['mustChangePassword']);
        }
        $organizers[$index]['updatedAt'] = date(DATE_ATOM);
        $updated = $organizers[$index];
        break;
    }

    if (!is_array($updated)) {
        json_response(['error' => 'Organizador não encontrado.'], 404);
    }

    write_organizers($organizers);
    append_audit_log('organizer_update', '', ['username' => $username]);
    json_response(['organizer' => public_organizer_profile($updated)]);
}

if ($action === 'resetPin') {
    $username = organizer_username_key($input['username'] ?? '');
    $pin = clean_text($input['pin'] ?? '', 80);

    if ($username === '') {
        json_response(['error' => 'Utilizador obrigatório.'], 422);
    }
    if (!$validPin($pin)) {
        json_response(['error' => 'Senha fraca. Use pelo menos 6 caracteres com letras e números.'], 422);
    }

    $updated = null;
    foreach ($organizers as $index => $item) {
        if (($item['username'] ?? '') !== $username) {
            continue;
        }

        $organizers[$index]['pinHash'] = hash_organizer_pin($pin);
        $organizers[$index]['mustChangePassword'] = true;
        $organizers[$index]['pinChangedAt'] = date(DATE_ATOM);
        $organizers[$index]['updatedAt'] = date(DATE_ATOM);
        $updated = $organizers[$index];
        break;
    }

    if (!is_array($updated)) {
        json_response(['error' => 'Organizador não encontrado.'], 404);
    }

    write_organizers($organizers);
    append_audit_log('organizer_reset_pin', '', ['username' => $username]);
    json_response(['organizer' => public_organizer_profile($updated)]);
}

if ($action === 'delete') {
    $username = organizer_username_key($input['username'] ?? '');
    if ($username === '') {
        json_response(['error' => 'Utilizador obrigatório.'], 422);
    }

    if ($username === current_admin_username()) {
        json_response(['error' => 'Não é permitido excluir a conta atualmente autenticada.'], 422);
    }

    $remaining = array_values(array_filter($organizers, static function (array $item) use ($username): bool {
        return ($item['username'] ?? '') !== $username;
    }));

    if (count($remaining) === count($organizers)) {
        json_response(['error' => 'Organizador não encontrado.'], 404);
    }

    write_organizers($remaining);
    append_audit_log('organizer_delete', '', ['username' => $username]);
    json_response(['deleted' => true, 'username' => $username]);
}

json_response(['error' => 'Ação inválida.'], 422);
