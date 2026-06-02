<?php
/**
 * Corrigir caminhos de imagem - Remover /alugserv_v2/
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

echo "<h1>Correção de Caminhos de Imagem</h1>";
echo "<style>body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:1rem;}table{border-collapse:collapse;width:100%;margin:1rem 0;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f0f0f0;}pre{background:#f5f5f5;padding:1rem;}</style>";

try {
    $db = getDB();

    // 1. Analisar registros atuais
    echo "<h2>1. Análise de Caminhos Atuais</h2>";

    $stmt = $db->query("
        SELECT COUNT(*) as total
        FROM equipments
        WHERE image LIKE '%alugserv_v2%'
    ");
    $count = $stmt->fetch()['total'];

    echo "<p><strong>Equipamentos com '/alugserv_v2/' no caminho:</strong> {$count}</p>";

    if ($count == 0) {
        echo "<p style='color:green;'>✅ Nenhum caminho precisa ser corrigido!</p>";
        exit;
    }

    // 2. Mostrar exemplos antes da correção
    echo "<h2>2. Exemplos de Caminhos Atuais</h2>";

    $stmt = $db->query("
        SELECT id, name, image
        FROM equipments
        WHERE image LIKE '%alugserv_v2%'
        LIMIT 10
    ");
    $examples = $stmt->fetchAll();

    echo "<table>";
    echo "<tr><th>ID</th><th>Nome</th><th>Caminho Atual</th></tr>";
    foreach ($examples as $ex) {
        echo "<tr>";
        echo "<td>{$ex['id']}</td>";
        echo "<td>{$ex['name']}</td>";
        echo "<td style='font-size:0.85rem;word-break:break-all;'>{$ex['image']}</td>";
        echo "</tr>";
    }
    echo "</table>";

    // 3. Executar correção
    echo "<h2>3. Executando Correção</h2>";

    // Corrigir caminhos: remover /alugserv_v2
    $stmt = $db->prepare("
        UPDATE equipments
        SET image = REPLACE(image, '/alugserv_v2/', '/')
        WHERE image LIKE '%alugserv_v2%'
    ");
    $stmt->execute();

    $affected = $stmt->rowCount();

    echo "<p style='color:green;font-weight:bold;'>✅ Correção concluída!</p>";
    echo "<p><strong>Registros atualizados:</strong> {$affected}</p>";

    // 4. Verificar resultado
    echo "<h2>4. Verificação Final</h2>";

    $stmt = $db->query("
        SELECT id, name, image
        FROM equipments
        WHERE image IS NOT NULL
        ORDER BY id
        LIMIT 10
    ");
    $results = $stmt->fetchAll();

    echo "<table>";
    echo "<tr><th>ID</th><th>Nome</th><th>Novo Caminho</th><th>Correto?</th></tr>";
    foreach ($results as $row) {
        $isCorrect = (strpos($row['image'], 'alugserv_v2') === false);
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['name']}</td>";
        echo "<td style='font-size:0.85rem;word-break:break-all;'>{$row['image']}</td>";
        echo "<td>" . ($isCorrect ? '✅' : '❌') . "</td>";
        echo "</tr>";
    }
    echo "</table>";

    // 5. Corrigir também gallery (galeria de imagens)
    echo "<h2>5. Corrigindo Gallery (se houver)</h2>";

    $stmt = $db->query("
        SELECT COUNT(*) as total
        FROM equipments
        WHERE gallery IS NOT NULL
        AND gallery LIKE '%alugserv_v2%'
    ");
    $galleryCount = $stmt->fetch()['total'];

    if ($galleryCount > 0) {
        echo "<p>Equipamentos com galeria contendo '/alugserv_v2/': {$galleryCount}</p>";

        $stmt = $db->prepare("
            UPDATE equipments
            SET gallery = REPLACE(gallery, '\\/alugserv_v2\\/', '\\/')
            WHERE gallery IS NOT NULL
            AND gallery LIKE '%alugserv_v2%'
        ");
        $stmt->execute();

        echo "<p style='color:green;'>✅ Galeria corrigida em {$stmt->rowCount()} equipamentos</p>";
    } else {
        echo "<p>✅ Nenhuma galeria precisa ser corrigida</p>";
    }

    // 6. Instruções finais
    echo "<h2>6. Próximos Passos</h2>";
    echo "<ol>";
    echo "<li>Recarregue a página do site: <a href='https://alugserv.com.br' target='_blank'>alugserv.com.br</a></li>";
    echo "<li>Verifique se as imagens aparecem corretamente</li>";
    echo "<li>Teste o admin em: <a href='/admin/equipments.html' target='_blank'>/admin/equipments.html</a></li>";
    echo "<li>Se tudo estiver OK, você pode deletar este arquivo (api/fix-image-paths.php)</li>";
    echo "</ol>";

    // Log
    error_log("=== CORREÇÃO DE CAMINHOS DE IMAGEM ===");
    error_log("Data: " . date('Y-m-d H:i:s'));
    error_log("Registros corrigidos: " . $affected);
    error_log("====================================");

} catch (Exception $e) {
    echo "<p style='color:red;'>❌ <strong>Erro:</strong> " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
    error_log("Erro na correção de caminhos: " . $e->getMessage());
}
?>
