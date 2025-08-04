<?php
/**
 * 从数据库获取记录 (使用数据库管理层)
 * 此文件已更新为使用 DatabaseManager，支持多种数据库类型
 */

require_once __DIR__ . '/DatabaseManager.php';

function getRecordsFromD1() {
    $dbManager = new DatabaseManager();
    return $dbManager->getRecords();
}
?>