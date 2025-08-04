<?php
// 数据库初始化脚本
// 用于创建clipboard表

require_once 'config/config.php';
require_once 'function/DatabaseManager.php';

// 初始化数据库管理器
$dbManager = new DatabaseManager();

// 执行初始化
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['init'])) {
    $result = $dbManager->initDatabase();
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
    // 获取存储信息
    $storageInfo = $dbManager->getStorageInfo();
    
    // 传递配置信息到前端
    $config = [
        'storageType' => $storageInfo['type'],
        'storageLocation' => $storageInfo['location'],
        'tableName' => $storageInfo['table_name'],
        'status' => $storageInfo['status']
    ];
    
    // 如果是 Cloudflare D1，添加相关信息
    if (CLOUD_POSITION == 0) {
        $config['accountId'] = CF_ACCOUNT_ID;
        $config['databaseId'] = CF_DATABASE_ID;
    } else {
        // 如果是 MySQL，添加相关信息
        $config['host'] = $storageInfo['host'];
        $config['database'] = $storageInfo['database'];
    }
    
    // 初始化消息变量
    $message = null;
    $success = null;
    
    // 检查URL参数中是否有消息
    if (isset($_GET['message'])) {
        $message = $_GET['message'];
        $success = isset($_GET['success']) ? (bool)$_GET['success'] : false;
    }
    
    // 读取HTML模板
    $html = file_get_contents('html/init_db.html');
    
    // 生成JavaScript变量
    $script = "<script>\n";
    $script .= "const config = " . json_encode($config) . ";\n";
    $script .= "const message = " . json_encode($message) . ";\n";
    $script .= "const success = " . json_encode($success) . ";\n";
    $script .= "</script>\n";
    
    // 插入JavaScript变量到HTML中
    $html = str_replace('</body>', $script . '</body>', $html);
    
    // 输出HTML
    echo $html;
}
?>
