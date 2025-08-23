# 数据库接入管理层使用说明

## 概述

数据库接入管理层 (`DatabaseManager.php`) 是一个统一的数据库操作接口，支持 Cloudflare D1 和 MySQL 两种存储方式。它根据配置文件自动选择合适的数据库操作方式，为应用程序提供一致的数据访问接口。

## 主要功能

### 1. 统一的数据库操作接口
- **保存数据**: `saveData($content, $length, $timestamp)`
- **获取记录**: `getRecords()`
- **删除记录**: `deleteRecord($id)`
- **初始化数据库**: `initDatabase()`

### 2. 存储位置信息管理
- **获取存储信息**: `getStorageInfo()` - 返回详细的存储配置信息
- **获取存储描述**: `getStorageDescription()` - 返回中文的存储位置描述

### 3. 自动存储方式选择
根据 `config/config.php` 中的 `CLOUD_POSITION` 配置：
- `0`: 使用 Cloudflare D1 数据库
- `1`: 使用 MySQL 数据库

## 使用方法

### 基本使用

```php
<?php
require_once 'function/DatabaseManager.php';

// 创建数据库管理器实例
$dbManager = new DatabaseManager();

// 获取存储位置信息
$storageInfo = $dbManager->getStorageInfo();
echo "当前使用: " . $dbManager->getStorageDescription();

// 保存数据
$content = "测试内容";
$length = strlen($content);
$timestamp = date('Y-m-d H:i:s');
$result = $dbManager->saveData($content, $length, $timestamp);

// 获取记录
$records = $dbManager->getRecords();

// 删除记录
$result = $dbManager->deleteRecord($id);

// 初始化数据库表
$result = $dbManager->initDatabase();
?>
```

### 在现有代码中的集成

数据库管理层已经集成到现有的所有PHP文件中：

1. **index.php**: 主页面，使用数据库管理层处理所有数据操作
2. **init_db.php**: 数据库初始化页面，使用数据库管理层初始化表
3. **function/*.php**: 所有原有的数据库操作函数已更新为使用数据库管理层

### 向后兼容性

为了保持向后兼容，原有的函数接口仍然可用：
- `saveToD1()` - 内部使用 DatabaseManager
- `getRecordsFromD1()` - 内部使用 DatabaseManager  
- `deleteFromD1()` - 内部使用 DatabaseManager
- `initDatabase()` - 内部使用 DatabaseManager

## 存储位置信息显示

### 前端显示
在主页面底部会自动显示当前的存储位置信息，包括：
- 数据存储类型 (Cloudflare D1 或 MySQL)
- 存储位置 (云端或本地)
- 表名
- 配置状态
- 相关的连接信息

### 获取存储信息的API
```javascript
// 通过AJAX获取存储信息
fetch('/CloudClipboard/index.php?get_storage_info=1')
    .then(response => response.json())
    .then(data => {
        console.log('存储类型:', data.type);
        console.log('存储位置:', data.location);
        console.log('配置状态:', data.status);
    });
```

## 配置说明

### Cloudflare D1 配置
在 `config/config.php` 中设置：
```php
define('CLOUD_POSITION', 0);  // 使用 Cloudflare D1
define('CF_ACCOUNT_ID', 'your_account_id');
define('CF_DATABASE_ID', 'your_database_id');
define('CF_API_TOKEN', 'your_api_token');
```

### MySQL 配置
在 `config/config.php` 中设置：
```php
define('CLOUD_POSITION', 1);  // 使用 MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'password');
define('DB_NAME', 'database_name');
```

## 测试功能

访问 `test_db_manager.php` 页面可以：
1. 查看当前存储配置信息
2. 测试数据库管理层的各项功能
3. 验证数据库连接和操作是否正常

## 错误处理

数据库管理层包含完善的错误处理机制：
- MySQL 连接失败时会抛出异常
- Cloudflare D1 API 调用失败时会返回错误信息
- 所有操作都有适当的错误检查和处理

## 优势

1. **统一接口**: 无论使用哪种数据库，应用程序代码保持一致
2. **易于切换**: 只需修改配置文件即可切换存储方式
3. **向后兼容**: 现有代码无需修改即可使用
4. **信息透明**: 用户可以清楚地看到当前使用的存储方式
5. **易于维护**: 所有数据库操作逻辑集中在一个类中

## 注意事项

1. 确保相应的数据库配置信息正确填写
2. MySQL 需要安装 PDO 扩展
3. Cloudflare D1 需要有效的 API Token 和权限
4. 建议在生产环境中启用错误日志记录