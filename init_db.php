<?php
// 数据库初始化脚本
// 用于创建clipboard表

require_once 'config/config.php';
require_once 'function/curlRequest.php';
require_once 'function/initDatabase.php';

// 执行初始化
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['init'])) {
    $result = initDatabase();
    $response = json_decode($result, true);
    
    // 返回JSON响应
    header('Content-Type: application/json');
    
    if ($response && isset($response['success']) && $response['success']) {
        echo json_encode([
            'success' => true,
            'message' => '数据库表创建成功！'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => '数据库表创建失败：' . ($response['errors'][0]['message'] ?? '未知错误')
        ]);
    }
    exit;
}

// 如果是GET请求，显示初始化页面
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 传递配置信息到前端
    $config = [
        'accountId' => CF_ACCOUNT_ID,
        'databaseId' => CF_DATABASE_ID,
        'tableName' => TABLE_NAME
    ];
    
    // 读取HTML模板
    $html = file_get_contents('html/init_db.html');
    
    // 生成JavaScript变量
    $script = "<script>\n";
    $script .= "const config = " . json_encode($config) . ";\n";
    if (isset($message) && isset($success)) {
        $script .= "const message = " . json_encode($message) . ";\n";
        $script .= "const success = " . json_encode($success) . ";\n";
    } else {
        $script .= "const message = null;\n";
        $script .= "const success = null;\n";
    }
    $script .= "</script>\n";
    
    // 插入JavaScript变量到HTML中
    $html = str_replace('</body>', $script . '</body>', $html);
    
    // 输出HTML
    echo $html;
}
?>
