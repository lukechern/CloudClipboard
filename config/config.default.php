<?php

//数据存储云端位置
//0 表示存储在 Cloudflare D1 数据库
//1 表示存储在 Localhost Mysql 数据库
define('CLOUD_POSITION', 0);


// Cloudflare D1 数据库配置
define('CF_ACCOUNT_ID', '');
define('CF_DATABASE_ID', '');
define('CF_API_TOKEN', '');

//MySql 数据库配置
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'cloudclipboard');

// 数据库表名
define('TABLE_NAME', 'cloudclipboard');


?>
