<?php
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
    
    $result = json_decode($response, true);
    
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