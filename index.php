<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/function/DatabaseManager.php';

// 初始化数据库管理器
$dbManager = new DatabaseManager();

// 处理保存内容请求
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['content'])) {
    $content = trim($_POST['content']);
    if (!empty($content)) {
        // 计算内容长度和时间戳
        $length = strlen($content);
        $timestamp = date('Y-m-d H:i:s');
        
        $result = $dbManager->saveData($content, $length, $timestamp);
        if ($result) {
            // 保存成功，重定向以避免重复提交
            header('Location: ./index.php?saved=1');
            exit();
        } else {
            echo "保存失败";
        }
    } else {
        echo "内容不能为空";
    }
    exit();
}



// 处理批量删除记录请求
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['batch_delete_ids'])) {
    $ids = json_decode($_POST['batch_delete_ids']);
    $successCount = 0;
    
    foreach ($ids as $id) {
        if ($dbManager->deleteRecord($id)) {
            $successCount++;
        }
    }
    
    if ($successCount == count($ids)) {
        echo "批量删除成功";
    } else {
        echo "部分删除失败";
    }
    exit();
}

// 处理获取记录请求
if (isset($_GET['get_records'])) {
    header('Content-Type: application/json');
    try {
        $records = $dbManager->getRecords();
        echo json_encode($records);
    } catch (Exception $e) {
        echo json_encode([]);
    }
    exit();
}

// 处理获取存储信息请求
if (isset($_GET['get_storage_info'])) {
    header('Content-Type: application/json');
    echo json_encode($dbManager->getStorageInfo());
    exit();
}

// 显示主页面
include __DIR__ . '/html/index.html';
?>
