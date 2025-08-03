<?php
// 引入配置文件
require_once 'config/config.php';

// 引入函数文件
require_once 'function/curlRequest.php';
require_once 'function/saveToD1.php';
require_once 'function/getRecordsFromD1.php';
require_once 'function/deleteFromD1.php';

// 处理API请求
if (isset($_GET['get_records'])) {
    header('Content-Type: application/json');
    echo json_encode(getRecordsFromD1());
    exit;
}

// 处理表单提交
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['content'])) {
        $content = $_POST['content'];
        $length = strlen($content);
        $timestamp = date('Y-m-d H:i:s');
        
        // 调用Cloudflare D1 API保存数据
        saveToD1($content, $length, $timestamp);
        
        // 如果是AJAX请求，返回成功响应
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            echo json_encode(['success' => true]);
            exit;
        }
    } elseif (isset($_POST['delete_id'])) {
        $id = intval($_POST['delete_id']);
        
        // 调用Cloudflare D1 API删除数据
        deleteFromD1($id);
        
        // 如果是AJAX请求，返回成功响应
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            echo json_encode(['success' => true]);
            exit;
        }
    }
}

// 从D1数据库获取所有记录
$records = getRecordsFromD1();
?>
<?php
// 如果没有特定的API请求，则显示主页面
if (!isset($_GET['get_records']) && empty($_POST)) {
    // 设置默认时区
    date_default_timezone_set('Asia/Shanghai');
    
    // 包含HTML页面
    include 'html/index.html';
}
?>
