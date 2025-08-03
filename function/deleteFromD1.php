<?php
function deleteFromD1($id) {
    $url = "https://api.cloudflare.com/client/v4/accounts/" . CF_ACCOUNT_ID . "/d1/database/" . CF_DATABASE_ID . "/query";
    
    $headers = [
        "Authorization: Bearer " . CF_API_TOKEN,
        "Content-Type: application/json"
    ];
    
    $query = "DELETE FROM " . TABLE_NAME . " WHERE id = ?";
    $params = [$id];
    
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
