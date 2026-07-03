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
    'allowedActivities' => current_admin_allowed_activities(),
    'organizerUsername' => organizer_username_key($_SESSION['organizerUsername'] ?? ''),
    'organizerName' => clean_text($_SESSION['organizerName'] ?? '', 120),
    'requiresPinChange' => bool_value($_SESSION['requiresPinChange'] ?? false),
    'isOwner' => current_admin_is_owner(),
]);
