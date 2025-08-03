<?php
function saveToD1($content, $length, $timestamp) {
    $url = "https://api.cloudflare.com/client/v4/accounts/" . CF_ACCOUNT_ID . "/d1/database/" . CF_DATABASE_ID . "/query";
    
    $headers = [
        "Authorization: Bearer " . CF_API_TOKEN,
        "Content-Type: application/json"
    ];
    
    $query = "INSERT INTO " . TABLE_NAME . " (content, length, timestamp) VALUES (?, ?, ?)";
    $params = [$content, $length, $timestamp];
    
    $data = [
        "params" => $params,
        "sql" => $query
    ];
    
    // 可以添加错误处理
    // $result = json_decode($response, true);
    // if (!$result['success']) {
    //     // 处理错误
    // }
    
    return curlRequest($url, $data, $headers);
}
?>
