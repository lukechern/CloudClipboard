<?php

/**
 * 数据库接入管理层
 * 统一管理数据库操作，支持 Cloudflare D1 和 MySQL 两种存储方式
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/curlRequest.php';

class DatabaseManager
{

    private $cloudPosition;
    private $storageInfo;

    public function __construct()
    {
        $this->cloudPosition = CLOUD_POSITION;
        $this->initStorageInfo();
    }

    /**
     * 初始化存储信息
     */
    private function initStorageInfo()
    {
        if ($this->cloudPosition == 0) {
            $this->storageInfo = [
                'type' => 'Cloudflare D1 数据库',
                'location' => 'Cloudflare 云端',
                'account_id' => CF_ACCOUNT_ID,
                'database_id' => CF_DATABASE_ID,
                'table_name' => TABLE_NAME,
                'status' => !empty(CF_ACCOUNT_ID) && !empty(CF_DATABASE_ID) && !empty(CF_API_TOKEN) ? '已配置' : '未配置'
            ];
        } else {
            $this->storageInfo = [
                'type' => 'MySQL 数据库',
                'location' => 'localhost 本地',
                'host' => DB_HOST,
                'database' => DB_NAME,
                'table_name' => TABLE_NAME,
                'status' => !empty(DB_HOST) && !empty(DB_NAME) ? '已配置' : '未配置'
            ];
        }
    }

    /**
     * 获取当前存储位置信息
     * @return array 存储位置详细信息
     */
    public function getStorageInfo()
    {
        return $this->storageInfo;
    }

    /**
     * 获取存储位置的中文描述
     * @return string 存储位置中文描述
     */
    public function getStorageDescription()
    {
        return $this->storageInfo['type'] . ' (' . $this->storageInfo['location'] . ')';
    }

    /**
     * 保存数据到数据库
     * @param string $content 内容
     * @param int $length 长度
     * @param string $timestamp 时间戳
     * @return mixed 操作结果
     */
    public function saveData($content, $length, $timestamp)
    {
        if ($this->cloudPosition == 0) {
            return $this->saveToCloudflareD1($content, $length, $timestamp);
        } else {
            return $this->saveToMySQL($content, $length, $timestamp);
        }
    }

    /**
     * 从数据库获取记录
     * @return array 记录数组
     */
    public function getRecords()
    {
        if ($this->cloudPosition == 0) {
            return $this->getRecordsFromCloudflareD1();
        } else {
            return $this->getRecordsFromMySQL();
        }
    }

    /**
     * 从数据库删除记录
     * @param int $id 记录ID
     * @return mixed 操作结果
     */
    public function deleteRecord($id)
    {
        if ($this->cloudPosition == 0) {
            return $this->deleteFromCloudflareD1($id);
        } else {
            return $this->deleteFromMySQL($id);
        }
    }

    /**
     * 初始化数据库表
     * @return mixed 操作结果
     */
    public function initDatabase()
    {
        if ($this->cloudPosition == 0) {
            return $this->initCloudflareD1();
        } else {
            return $this->initMySQL();
        }
    }

    // ==================== Cloudflare D1 操作方法 ====================

    /**
     * 保存数据到 Cloudflare D1
     */
    private function saveToCloudflareD1($content, $length, $timestamp)
    {
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

        return curlRequest($url, $data, $headers);
    }

    /**
     * 从 Cloudflare D1 获取记录
     */
    private function getRecordsFromCloudflareD1()
    {
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

        if (empty($response)) {
            return [];
        }

        $result = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return [];
        }

        if (isset($result['result']) && isset($result['result'][0]) && isset($result['result'][0]['success']) && $result['result'][0]['success']) {
            $records = $result['result'][0]['results'] ?? [];

            foreach ($records as &$record) {
                if (isset($record['content'])) {
                    $record['content'] = trim($record['content']);
                }
            }

            return $records;
        }

        return [];
    }

    /**
     * 从 Cloudflare D1 删除记录
     */
    private function deleteFromCloudflareD1($id)
    {
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

        return curlRequest($url, $data, $headers);
    }

    /**
     * 初始化 Cloudflare D1 数据库表
     */
    private function initCloudflareD1()
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/" . CF_ACCOUNT_ID . "/d1/database/" . CF_DATABASE_ID . "/query";

        $headers = [
            "Authorization: Bearer " . CF_API_TOKEN,
            "Content-Type: application/json"
        ];

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

    // ==================== MySQL 操作方法 ====================

    /**
     * 获取 MySQL 连接
     */
    private function getMySQLConnection()
    {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
            return $pdo;
        } catch (PDOException $e) {
            throw new Exception("MySQL 连接失败: " . $e->getMessage());
        }
    }

    /**
     * 保存数据到 MySQL
     */
    private function saveToMySQL($content, $length, $timestamp)
    {
        try {
            $pdo = $this->getMySQLConnection();
            $stmt = $pdo->prepare("INSERT INTO " . TABLE_NAME . " (content, length, timestamp) VALUES (?, ?, ?)");
            $result = $stmt->execute([$content, $length, $timestamp]);

            return json_encode([
                'success' => $result,
                'insert_id' => $pdo->lastInsertId()
            ]);
        } catch (Exception $e) {
            return json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * 从 MySQL 获取记录
     */
    private function getRecordsFromMySQL()
    {
        try {
            $pdo = $this->getMySQLConnection();
            $stmt = $pdo->query("SELECT * FROM " . TABLE_NAME . " ORDER BY timestamp DESC");
            $records = $stmt->fetchAll();

            foreach ($records as &$record) {
                if (isset($record['content'])) {
                    $record['content'] = trim($record['content']);
                }
            }

            return $records;
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * 从 MySQL 删除记录
     */
    private function deleteFromMySQL($id)
    {
        try {
            $pdo = $this->getMySQLConnection();
            $stmt = $pdo->prepare("DELETE FROM " . TABLE_NAME . " WHERE id = ?");
            $result = $stmt->execute([$id]);

            return json_encode([
                'success' => $result,
                'affected_rows' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            return json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * 初始化 MySQL 数据库表
     */
    private function initMySQL()
    {
        try {
            $pdo = $this->getMySQLConnection();
            $query = "CREATE TABLE IF NOT EXISTS " . TABLE_NAME . " (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                length INT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

            $result = $pdo->exec($query);

            return json_encode([
                'success' => true,
                'message' => 'MySQL 表创建成功'
            ]);
        } catch (Exception $e) {
            return json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
