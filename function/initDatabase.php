<?php
function initDatabase() {
    $url = "https://api.cloudflare.com/client/v4/accounts/" . CF_ACCOUNT_ID . "/d1/database/" . CF_DATABASE_ID . "/query";
    
    $headers = [
        "Authorization: Bearer " . CF_API_TOKEN,
        "Content-Type: application/json"
    ];
    
    // 创建表的SQL语句
    $query = "CREATE TABLE IF NOT EXISTS " . TABLE_NAME . " (
        id INTEGER PRIMARY KEY,
        content TEXT NOT NULL,
        length INTEGER NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )";
    
    $data = [
        "sql" => $query
    ];
    
    return curlRequest($url, $data, $headers);
}
?>
