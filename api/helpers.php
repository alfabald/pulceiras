<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
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

function bool_value(mixed $value): bool
{
    if (is_bool($value)) {
        return $value;
    }

    if (is_numeric($value)) {
        return (int) $value === 1;
    }

    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'sim', 'confirmado'], true);
}

function normalize_timestamp(mixed $value): string
{
    $text = clean_text($value, 80);
    if ($text === '') {
        return '';
    }

    $timestamp = strtotime($text);
    if ($timestamp === false) {
        return '';
    }

    return date(DATE_ATOM, $timestamp);
}

function normalize_participant(array $input): array
{
    $code = clean_text($input['code'] ?? '', 40);
    if ($code === '') {
        $code = make_code();
    }

    $hasAdults = array_key_exists('adults', $input);
    $hasChildren = array_key_exists('childrenUnder16', $input);
    $childrenUnder16 = max(0, min(50, (int) ($input['childrenUnder16'] ?? 0)));

    if ($hasAdults || $hasChildren) {
        $adults = max(0, min(50, (int) ($input['adults'] ?? 0)));
        $guests = $adults + $childrenUnder16;
        if ($guests <= 0) {
            $adults = 1;
            $guests = 1;
        }
    } else {
        $guests = max(1, min(50, (int) ($input['guests'] ?? 1)));
        $adults = $guests;
        $childrenUnder16 = 0;
    }

    $baseContribution = ($adults * 10) + ($childrenUnder16 * 5);
    $contribution = normalize_amount($input['contribution'] ?? $baseContribution);
    $agreedAmountRaw = array_key_exists('agreedAmount', $input)
        ? $input['agreedAmount']
        : ($input['contribution'] ?? 0);
    $agreedAmount = normalize_amount($agreedAmountRaw);
    $amountConfirmed = bool_value($input['amountConfirmed'] ?? false);
    $amountConfirmedAt = $amountConfirmed
        ? (normalize_timestamp($input['amountConfirmedAt'] ?? '') ?: date(DATE_ATOM))
        : '';
    $checkedInAt = normalize_timestamp($input['checkedInAt'] ?? '');
    $createdAt = normalize_timestamp($input['createdAt'] ?? '') ?: date(DATE_ATOM);
    $updatedAt = date(DATE_ATOM);

    return [
        'code' => $code,
        'fullName' => clean_text($input['fullName'] ?? '', 120),
        'phone' => clean_text($input['phone'] ?? '', 80),
        'email' => clean_text($input['email'] ?? '', 120),
        'city' => clean_text($input['city'] ?? '', 100),
        'activityName' => clean_text($input['activityName'] ?? 'Atividade geral', 120),
        'adults' => $adults,
        'childrenUnder16' => $childrenUnder16,
        'guests' => $guests,
        'contribution' => $contribution,
        'agreedAmount' => $agreedAmount,
        'amountConfirmed' => $amountConfirmed,
        'amountConfirmedAt' => $amountConfirmedAt,
        'committeeAgreement' => clean_text($input['committeeAgreement'] ?? 'Padrão da comissão', 120),
        'paymentStatus' => clean_text(
            $input['paymentStatus'] ?? ($amountConfirmed ? 'Confirmado pelo organizador' : 'Aguardando confirmação do organizador'),
            90
        ),
        'note' => clean_text($input['note'] ?? '', 500),
        'checkedInAt' => $checkedInAt,
        'createdAt' => $createdAt,
        'updatedAt' => $updatedAt,
    ];
}

function participants_sorted(array $participants): array
{
    usort($participants, static function (array $a, array $b): int {
        return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });

    return $participants;
}

function postgres_enabled(): bool
{
    return env_string('DATABASE_URL') !== '';
}

function postgres_table(): string
{
    $table = env_string('POSTGRES_TABLE', 'participants_store');
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $table)) {
        return 'participants_store';
    }

    return $table;
}

function postgres_connection(): ?PDO
{
    static $pdo = null;
    static $attempted = false;

    if ($attempted) {
        return $pdo;
    }

    $attempted = true;
    $url = env_string('DATABASE_URL');
    if ($url === '') {
        return null;
    }

    $parts = parse_url($url);
    if (!is_array($parts)) {
        return null;
    }

    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if ($scheme !== 'postgres' && $scheme !== 'postgresql') {
        return null;
    }

    $host = (string) ($parts['host'] ?? 'localhost');
    $port = (int) ($parts['port'] ?? 5432);
    $dbname = ltrim((string) ($parts['path'] ?? ''), '/');
    $user = (string) ($parts['user'] ?? '');
    $pass = (string) ($parts['pass'] ?? '');

    if ($dbname === '') {
        return null;
    }

    $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=require', $host, $port, $dbname);

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (Throwable) {
        $pdo = null;
    }

    return $pdo;
}

function ensure_postgres_schema(PDO $pdo): void
{
    $table = postgres_table();
    $sql = sprintf(
        'create table if not exists %s (
            code text primary key,
            payload jsonb not null,
            updated_at timestamptz not null default now()
        )',
        $table
    );
    $pdo->exec($sql);
}

function read_participants_postgres(): ?array
{
    $pdo = postgres_connection();
    if (!$pdo) {
        return null;
    }

    try {
        ensure_postgres_schema($pdo);
        $table = postgres_table();
        $stmt = $pdo->query(sprintf('select payload from %s order by updated_at desc', $table));
        $rows = $stmt ? $stmt->fetchAll() : [];
    } catch (Throwable) {
        return null;
    }

    $participants = [];
    foreach ($rows as $row) {
        $payload = $row['payload'] ?? null;
        if (is_string($payload)) {
            $decoded = json_decode($payload, true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }

        if (is_array($payload)) {
            $participants[] = normalize_participant($payload);
        }
    }

    return participants_sorted($participants);
}

function write_participants_postgres(array $participants): bool
{
    $pdo = postgres_connection();
    if (!$pdo) {
        return false;
    }

    try {
        ensure_postgres_schema($pdo);
        $table = postgres_table();

        $records = [];
        foreach ($participants as $participant) {
            if (!is_array($participant)) {
                continue;
            }

            $normalized = normalize_participant($participant);
            $records[$normalized['code']] = $normalized;
        }

        $pdo->beginTransaction();

        if (count($records) === 0) {
            $pdo->exec(sprintf('delete from %s', $table));
            $pdo->commit();
            return true;
        }

        $codes = array_keys($records);
        $placeholders = implode(',', array_fill(0, count($codes), '?'));
        $deleteStmt = $pdo->prepare(sprintf('delete from %s where code not in (%s)', $table, $placeholders));
        $deleteStmt->execute($codes);

        $upsertSql = sprintf(
            'insert into %s (code, payload, updated_at)
             values (:code, :payload::jsonb, now())
             on conflict (code) do update set payload = excluded.payload, updated_at = now()',
            $table
        );
        $upsertStmt = $pdo->prepare($upsertSql);

        foreach ($records as $code => $participant) {
            $upsertStmt->execute([
                ':code' => $code,
                ':payload' => json_encode($participant, JSON_UNESCAPED_UNICODE),
            ]);
        }

        $pdo->commit();
        return true;
    } catch (Throwable) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        return false;
    }
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

    return participants_sorted(array_map('normalize_participant', $participants));
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
            'payload' => normalize_participant($participant),
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
    if (postgres_enabled()) {
        $postgresParticipants = read_participants_postgres();
        if (is_array($postgresParticipants)) {
            return $postgresParticipants;
        }
    }

    if (supabase_enabled()) {
        $supabaseParticipants = read_participants_supabase();
        if (is_array($supabaseParticipants)) {
            return $supabaseParticipants;
        }
    }

    $contents = file_get_contents(data_file());
    $participants = json_decode($contents ?: '[]', true);

    if (!is_array($participants)) {
        return [];
    }

    return participants_sorted(array_map('normalize_participant', $participants));
}

function write_participants(array $participants): void
{
    $normalized = [];
    foreach ($participants as $participant) {
        if (!is_array($participant)) {
            continue;
        }

        $item = normalize_participant($participant);
        $normalized[$item['code']] = $item;
    }

    $participants = participants_sorted(array_values($normalized));

    if (postgres_enabled() && write_participants_postgres($participants)) {
        return;
    }

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

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

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
