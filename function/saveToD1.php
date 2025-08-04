<?php
/**
 * 保存数据到数据库 (使用数据库管理层)
 * 此文件已更新为使用 DatabaseManager，支持多种数据库类型
 */

require_once __DIR__ . '/DatabaseManager.php';

function saveToD1($content, $length, $timestamp) {
    $dbManager = new DatabaseManager();
    return $dbManager->saveData($content, $length, $timestamp);
}
?>
