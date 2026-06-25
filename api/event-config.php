<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response([
        'config' => read_event_config(),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método não permitido.'], 405);
}

require_permission('manageSettings');
check_rate_limit('event-config:' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 20, 60);

$input = validate_json_request();
$config = write_event_config($input);

append_audit_log('event_config_updated', '', [
    'eventName' => $config['eventName'],
    'eventDate' => $config['eventDate'],
]);

json_response([
    'config' => $config,
]);
