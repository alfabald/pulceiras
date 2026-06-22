<?php
/**
 * Teste de Configuração do Servidor
 * Acesse: https://seu-dominio.com/Pulceiras/health-check.php
 * 
 * REMOVER EM PRODUÇÃO FINAL (segurança)
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Saúde - Passe Solidário Gabú Hamburg</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #207a48;
            margin-top: 0;
        }
        .check-item {
            margin: 15px 0;
            padding: 12px;
            border-left: 4px solid #ddd;
            background: #fafafa;
        }
        .check-item.ok {
            border-left-color: #207a48;
            background: #f0f8f5;
        }
        .check-item.error {
            border-left-color: #b8322b;
            background: #faf0f0;
        }
        .check-item.warning {
            border-left-color: #f4c542;
            background: #fffdf8;
        }
        .check-label {
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .check-value {
            color: #666;
            font-size: 0.9em;
        }
        .status-icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 12px;
            line-height: 20px;
            text-align: center;
            color: white;
            font-weight: bold;
            margin-right: 8px;
        }
        .status-icon.ok { background: #207a48; }
        .status-icon.error { background: #b8322b; }
        .status-icon.warning { background: #f4c542; }
        .summary {
            margin-top: 30px;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #ddd;
        }
        .summary.ready {
            border-color: #207a48;
            background: #f0f8f5;
        }
        .summary.issues {
            border-color: #b8322b;
            background: #faf0f0;
        }
        .warning-box {
            margin-top: 20px;
            padding: 15px;
            background: #faf0f0;
            border: 1px solid #b8322b;
            border-radius: 6px;
            color: #8f241f;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✓ Verificação de Saúde do Servidor</h1>
        <p style="color: #666; margin-top: -10px;">Passe Solidário Gabú Hamburg</p>

        <?php
        $checks = [];
        $hasErrors = false;
        $hasWarnings = false;

        // 1. Versão PHP
        $phpVersion = phpversion();
        $phpOk = version_compare($phpVersion, '7.4.0', '>=');
        $checks[] = [
            'label' => 'Versão PHP',
            'status' => $phpOk ? 'ok' : 'error',
            'value' => $phpVersion . ($phpOk ? ' (OK)' : ' (requerido 7.4+)'),
        ];
        if (!$phpOk) $hasErrors = true;

        // 2. Extensões PHP obrigatórias
        $extensions = ['json', 'mbstring'];
        foreach ($extensions as $ext) {
            $ok = extension_loaded($ext);
            $checks[] = [
                'label' => "Extensão PHP: $ext",
                'status' => $ok ? 'ok' : 'error',
                'value' => $ok ? 'Instalada' : 'NÃO INSTALADA',
            ];
            if (!$ok) $hasErrors = true;
        }

        // 3. Pasta data/
        $dataDir = __DIR__ . '/data';
        $dataExists = is_dir($dataDir);
        $dataWritable = $dataExists && is_writable($dataDir);
        $checks[] = [
            'label' => 'Diretório data/',
            'status' => $dataWritable ? 'ok' : ($dataExists ? 'warning' : 'error'),
            'value' => $dataWritable ? 'Existe e é gravável' : ($dataExists ? 'Existe mas SEM PERMISSÃO DE ESCRITA' : 'NÃO EXISTE'),
        ];
        if ($dataExists && !$dataWritable) $hasWarnings = true;
        if (!$dataExists) $hasErrors = true;

        // 4. Arquivo participants.json
        $jsonFile = $dataDir . '/participants.json';
        $jsonExists = file_exists($jsonFile);
        $jsonReadable = $jsonExists && is_readable($jsonFile);
        $checks[] = [
            'label' => 'Arquivo participants.json',
            'status' => $jsonReadable ? 'ok' : 'warning',
            'value' => $jsonReadable ? 'Existe' : 'Será criado na primeira inscrição',
        ];

        // 5. Arquivo .htaccess
        $htaccess = __DIR__ . '/.htaccess';
        $htaccessExists = file_exists($htaccess);
        $checks[] = [
            'label' => 'Arquivo .htaccess',
            'status' => $htaccessExists ? 'ok' : 'warning',
            'value' => $htaccessExists ? 'Configurado' : 'Não encontrado (segurança reduzida)',
        ];
        if (!$htaccessExists) $hasWarnings = true;

        // 6. Acesso ao /api/
        $apiTest = @file_get_contents(__DIR__ . '/api/helpers.php', false, null, 0, 10);
        $apiOk = $apiTest !== false;
        $checks[] = [
            'label' => 'Acesso aos arquivos API',
            'status' => $apiOk ? 'ok' : 'error',
            'value' => $apiOk ? 'OK' : 'Não consegue acessar',
        ];
        if (!$apiOk) $hasErrors = true;

        // 7. Verificar HTTPS (recomendado)
        $https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
        $checks[] = [
            'label' => 'HTTPS (segurança)',
            'status' => $https ? 'ok' : 'warning',
            'value' => $https ? 'Habilitado' : 'Desabilitado (recomendado para produção)',
        ];
        if (!$https) $hasWarnings = true;

        // 8. Espaço em disco
        $freeSpace = @disk_free_space(__DIR__);
        $freeSpaceOk = $freeSpace && $freeSpace > 10485760; // 10MB mínimo
        $freeSpaceMB = $freeSpace ? round($freeSpace / 1048576) : 0;
        $checks[] = [
            'label' => 'Espaço em disco',
            'status' => $freeSpaceOk ? 'ok' : 'warning',
            'value' => $freeSpaceMB . ' MB livres' . ($freeSpaceOk ? '' : ' (pouco espaço)'),
        ];
        if (!$freeSpaceOk) $hasWarnings = true;

        // 9. Função session_start
        $sessionOk = function_exists('session_start');
        $checks[] = [
            'label' => 'Sessões PHP',
            'status' => $sessionOk ? 'ok' : 'error',
            'value' => $sessionOk ? 'Disponível' : 'NÃO DISPONÍVEL',
        ];
        if (!$sessionOk) $hasErrors = true;

        // 10. Arquivo /tmp ou temp
        $tempDir = sys_get_temp_dir();
        $tempOk = $tempDir && is_writable($tempDir);
        $checks[] = [
            'label' => 'Diretório temporário',
            'status' => $tempOk ? 'ok' : 'warning',
            'value' => $tempOk ? $tempDir : 'Não acessível (rate limiting pode não funcionar)',
        ];
        if (!$tempOk) $hasWarnings = true;

        // Renderizar checks
        foreach ($checks as $check) {
            $statusIcon = $check['status'] === 'ok' ? '✓' : ($check['status'] === 'error' ? '✗' : '!');
            echo '<div class="check-item ' . $check['status'] . '">';
            echo '<span class="status-icon ' . $check['status'] . '">' . $statusIcon . '</span>';
            echo '<span class="check-label">' . $check['label'] . '</span>';
            echo '<span class="check-value">' . $check['value'] . '</span>';
            echo '</div>';
        }

        // Resumo
        echo '<div class="summary ' . ($hasErrors ? 'issues' : 'ready') . '">';
        if ($hasErrors) {
            echo '<strong>❌ Problemas detectados:</strong><br>';
            echo 'O servidor NÃO está pronto. Corrija os erros acima antes de usar.';
        } else if ($hasWarnings) {
            echo '<strong>⚠️ Avisos:</strong><br>';
            echo 'O servidor funciona, mas há alguns avisos. Recomendamos revisar para segurança/performance.';
        } else {
            echo '<strong>✓ Servidor OK!</strong><br>';
            echo 'Tudo configurado corretamente. Pronto para produção.';
        }
        echo '</div>';

        // Aviso de segurança
        echo '<div class="warning-box">';
        echo '<strong>⚠️ IMPORTANTE - Segurança:</strong><br>';
        echo 'Este arquivo (health-check.php) expõe informações do servidor.<br>';
        echo '<strong>REMOVER ANTES DE ABRIR PARA O PÚBLICO!</strong><br>';
        echo 'Delete este arquivo após verificar que tudo está funcionando.';
        echo '</div>';
        ?>
    </div>
</body>
</html>
