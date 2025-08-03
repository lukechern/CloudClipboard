<?php
require_once __DIR__ . '/curlRequest.php';

function getRecordsFromD1() {
    $url = "https://api.cloudflare.com/client/v4/accounts/" . CF_ACCOUNT_ID . "/d1/database/" . CF_DATABASE_ID . "/query";
    
    $headers = [
        "Authorization: Bearer " . CF_API_TOKEN,
        "Content-Type: application/json"
    ];
    
    $query = "SELECT * FROM " . TABLE_NAME . " ORDER BY timestamp DESC";
    $data = [
        "sql" => $query
    ];
    
    $response = curlRequest($url, $data, $headers);
    
    // 检查响应是否为空
    if (empty($response)) {
        return [];
    }
    
    $result = json_decode($response, true);
    
    // 检查JSON解析是否成功
    if (json_last_error() !== JSON_ERROR_NONE) {
        // JSON解析失败，返回空数组
        return [];
    }
    
    if (isset($result['result']) && isset($result['result'][0]) && isset($result['result'][0]['success']) && $result['result'][0]['success']) {
        $records = $result['result'][0]['results'] ?? [];
        
        // 对记录内容进行trim处理
        foreach ($records as &$record) {
            if (isset($record['content'])) {
                $record['content'] = trim($record['content']);
            }
        }
        
        return $records;
    }
    
    return [];
}
?>