<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método não permitido.'], 405);
}

json_response([
    'isAdmin' => is_admin(),
    'role' => current_admin_role(),
    'permissions' => $_SESSION['permissions'] ?? [],
]);
