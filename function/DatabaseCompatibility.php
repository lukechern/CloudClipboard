<?php
/**
 * 数据库兼容性函数
 * 为了向后兼容，保留原有的函数接口，内部使用 DatabaseManager
 */

require_once __DIR__ . '/DatabaseManager.php';

// 全局数据库管理器实例
$globalDbManager = null;

/**
 * 获取全局数据库管理器实例
 */
function getDbManager() {
    global $globalDbManager;
    if ($globalDbManager === null) {
        $globalDbManager = new DatabaseManager();
    }
    return $globalDbManager;
}

/**
 * 保存数据到数据库 (兼容性函数)
 * @param string $content 内容
 * @param int $length 长度
 * @param string $timestamp 时间戳
 * @return mixed 操作结果
 */
function saveToD1($content, $length, $timestamp) {
    return getDbManager()->saveData($content, $length, $timestamp);
}

/**
 * 从数据库获取记录 (兼容性函数)
 * @return array 记录数组
 */
function getRecordsFromD1() {
    return getDbManager()->getRecords();
}

/**
 * 从数据库删除记录 (兼容性函数)
 * @param int $id 记录ID
 * @return mixed 操作结果
 */
function deleteFromD1($id) {
    return getDbManager()->deleteRecord($id);
}

/**
 * 初始化数据库表 (兼容性函数)
 * @return mixed 操作结果
 */
function initDatabase() {
    return getDbManager()->initDatabase();
}

?>