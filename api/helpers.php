<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function validate_json_request(): array
{
    // Verificar Content-Type
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') === false && $_SERVER['REQUEST_METHOD'] === 'POST') {
        json_response(['error' => 'Content-Type deve ser application/json.'], 400);
    }

    // Limitar tamanho do corpo
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 10485760) { // 10MB máximo
        json_response(['error' => 'Payload muito grande.'], 413);
    }

    $raw = file_get_contents('php://input') ?: '';
    $input = json_decode($raw, true);

    if (!is_array($input)) {
        json_response(['error' => 'Dados JSON inválidos.'], 400);
    }

    return $input;
}

function sanitize_string(mixed $value): string
{
    return clean_text($value, 160);
}

function clean_text(mixed $value, int $maxLength = 160): string
{
    $text = trim((string) $value);

    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $maxLength);
    }

    return substr($text, 0, $maxLength);
}

function env_string(string $name, string $default = ''): string
{
    $value = getenv($name);
    if ($value === false) {
        return $default;
    }

    return trim((string) $value);
}

function supabase_enabled(): bool
{
    return env_string('SUPABASE_URL') !== '' && env_string('SUPABASE_SERVICE_ROLE_KEY') !== '';
}

function supabase_table(): string
{
    return env_string('SUPABASE_TABLE', 'participants_store');
}

function http_json_request(string $method, string $url, array $headers = [], ?string $body = null): array
{
    $headerLines = [];
    foreach ($headers as $key => $value) {
        $headerLines[] = $key . ': ' . $value;
    }

    $context = stream_context_create([
        'http' => [
            'method' => strtoupper($method),
            'header' => implode("\r\n", $headerLines),
            'content' => $body ?? '',
            'ignore_errors' => true,
            'timeout' => 20,
        ],
    ]);

    $responseBody = file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $status = 0;

    if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})\s/', $responseHeaders[0], $matches)) {
        $status = (int) $matches[1];
    }

    return [
        'status' => $status,
        'body' => $responseBody === false ? '' : $responseBody,
    ];
}

function supabase_request(string $method, string $pathWithQuery, ?array $payload = null, array $extraHeaders = []): array
{
    $baseUrl = rtrim(env_string('SUPABASE_URL'), '/');
    $serviceRoleKey = env_string('SUPABASE_SERVICE_ROLE_KEY');

    if ($baseUrl === '' || $serviceRoleKey === '') {
        return ['status' => 0, 'body' => ''];
    }

    $headers = [
        'apikey' => $serviceRoleKey,
        'Authorization' => 'Bearer ' . $serviceRoleKey,
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ];

    foreach ($extraHeaders as $key => $value) {
        $headers[$key] = $value;
    }

    $url = $baseUrl . '/rest/v1/' . ltrim($pathWithQuery, '/');
    $body = $payload === null ? null : json_encode($payload, JSON_UNESCAPED_UNICODE);

    return http_json_request($method, $url, $headers, $body);
}

function read_participants_supabase(): ?array
{
    $table = rawurlencode(supabase_table());
    $response = supabase_request('GET', $table . '?select=payload');

    if ($response['status'] < 200 || $response['status'] >= 300) {
        return null;
    }

    $rows = json_decode($response['body'] ?: '[]', true);
    if (!is_array($rows)) {
        return null;
    }

    $participants = [];
    foreach ($rows as $row) {
        if (!is_array($row)) {
            continue;
        }

        $payload = $row['payload'] ?? null;
        if (is_array($payload)) {
            $participants[] = $payload;
        }
    }

    usort($participants, static function (array $a, array $b): int {
        return strcmp((string) ($a['createdAt'] ?? ''), (string) ($b['createdAt'] ?? ''));
    });

    return $participants;
}

function write_participants_supabase(array $participants): bool
{
    $table = rawurlencode(supabase_table());
    $records = [];

    foreach ($participants as $participant) {
        if (!is_array($participant)) {
            continue;
        }

        $code = clean_text($participant['code'] ?? '', 40);
        if ($code === '') {
            continue;
        }

        $records[] = [
            'code' => $code,
            'payload' => $participant,
        ];
    }

    if (count($records) > 0) {
        $upsertResponse = supabase_request(
            'POST',
            $table . '?on_conflict=code',
            $records,
            ['Prefer' => 'resolution=merge-duplicates,return=minimal']
        );

        if ($upsertResponse['status'] < 200 || $upsertResponse['status'] >= 300) {
            return false;
        }
    }

    return true;
}

function data_file(): string
{
    $directory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }

    $file = $directory . DIRECTORY_SEPARATOR . 'participants.json';

    if (!file_exists($file)) {
        file_put_contents($file, "[]\n", LOCK_EX);
    }

    return $file;
}

function read_participants(): array
{
    if (supabase_enabled()) {
        $supabaseParticipants = read_participants_supabase();
        if (is_array($supabaseParticipants)) {
            return $supabaseParticipants;
        }
    }

    $contents = file_get_contents(data_file());
    $participants = json_decode($contents ?: '[]', true);

    return is_array($participants) ? $participants : [];
}

function write_participants(array $participants): void
{
    if (supabase_enabled() && write_participants_supabase($participants)) {
        return;
    }

    $file = data_file();
    $handle = fopen($file, 'c+');

    if ($handle === false) {
        json_response(['error' => 'Não foi possível abrir o ficheiro de dados.'], 500);
    }

    flock($handle, LOCK_EX);
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode(array_values($participants), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fwrite($handle, "\n");
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

function make_code(): string
{
    return 'GABU-' . date('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
}

function normalize_amount(mixed $value): float
{
    $amount = (float) str_replace(',', '.', (string) $value);
    return max(0, round($amount, 2));
}

function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('gabu_pass_admin');
    session_start();
}

function is_admin(): bool
{
    start_admin_session();
    return ($_SESSION['is_admin'] ?? false) === true;
}

function require_admin(): void
{
    if (!is_admin()) {
        json_response(['error' => 'Acesso reservado aos organizadores.'], 401);
    }
}

function verify_admin_pin(string $pin): bool
{
    $hash = hash('sha256', ADMIN_PIN_SALT . $pin);
    return hash_equals(ADMIN_PIN_HASH, $hash);
}

function check_rate_limit(string $identifier = '', int $maxAttempts = 10, int $windowSeconds = 60): void
{
    if (empty($identifier)) {
        $identifier = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    $sessionFile = sys_get_temp_dir() . '/gabu_ratelimit_' . md5($identifier) . '.json';
    $now = time();
    $windowStart = $now - $windowSeconds;

    $attempts = [];
    if (file_exists($sessionFile)) {
        $data = json_decode(file_get_contents($sessionFile), true);
        $attempts = array_filter($data['attempts'] ?? [], fn($t) => $t > $windowStart);
    }

    if (count($attempts) >= $maxAttempts) {
        json_response(['error' => 'Muitas tentativas. Aguarde alguns minutos.'], 429);
    }

    $attempts[] = $now;
    file_put_contents($sessionFile, json_encode(['attempts' => $attempts], JSON_PRETTY_PRINT), LOCK_EX);
}
