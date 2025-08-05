# 数据迁移指南

## 概述

这个目录包含了从PHP版本CloudClipboard迁移到Cloudflare Pages版本的工具和脚本。

## 迁移方法

### 方法一：浏览器控制台迁移（推荐）

1. **准备工作**
   - 确保新的Cloudflare Pages版本已部署并可正常访问
   - 确保旧的PHP版本仍可访问

2. **执行迁移**
   ```javascript
   // 在浏览器控制台中执行以下步骤：
   
   // 1. 加载迁移脚本
   const script = document.createElement('script');
   script.src = 'https://your-domain.pages.dev/migration/migrate-data.js';
   document.head.appendChild(script);
   
   // 2. 等待脚本加载完成后，配置源和目标地址
   migrationConfig.SOURCE_API = 'https://your-old-domain.com/index.php?get_records=1';
   migrationConfig.TARGET_API = 'https://your-new-domain.pages.dev/api/records';
   
   // 3. 开始迁移
   migrateData();
   ```

3. **监控进度**
   - 控制台会显示迁移进度
   - 完成后会生成详细报告

### 方法二：Node.js脚本迁移

1. **安装依赖**
   ```bash
   npm install node-fetch
   ```

2. **修改配置**
   编辑 `migrate-data.js` 文件中的 `CONFIG` 对象：
   ```javascript
   const CONFIG = {
       SOURCE_API: 'https://your-old-domain.com/index.php?get_records=1',
       TARGET_API: 'https://your-new-domain.pages.dev/api/records',
       BATCH_SIZE: 10
   };
   ```

3. **执行迁移**
   ```bash
   node migrate-data.js
   ```

### 方法三：手动导出导入

如果自动迁移遇到问题，可以手动操作：

1. **导出数据**
   - 访问旧版本的 `index.php?get_records=1`
   - 保存返回的JSON数据

2. **导入数据**
   - 在新版本中逐条添加记录
   - 或使用浏览器控制台批量添加

## 迁移注意事项

### 数据格式兼容性

新版本与旧版本的数据格式完全兼容：
- `id`: 记录ID（迁移后会重新分配）
- `content`: 文本内容
- `length`: 内容长度
- `timestamp`: 时间戳

### 迁移限制

1. **记录ID**：迁移后记录ID会重新分配
2. **时间戳**：会保持原有的创建时间
3. **批量大小**：默认每批处理10条记录，可根据需要调整

### 错误处理

- 迁移脚本会自动重试失败的记录
- 生成详细的错误报告
- 支持断点续传（手动重新运行即可）

## 验证迁移结果

迁移完成后，请验证：

1. **记录数量**：确认新系统中的记录数量正确
2. **内容完整性**：抽查几条记录确认内容无误
3. **功能测试**：测试保存、查看、删除等功能

## 回滚计划

如果迁移出现问题：

1. **保留旧系统**：在确认迁移成功前不要删除旧系统
2. **数据备份**：迁移前备份D1数据库
3. **DNS切换**：可以随时切换DNS指向旧系统

## 故障排除

### 常见问题

1. **CORS错误**
   - 确保新系统允许跨域请求
   - 或在同域下执行迁移脚本

2. **API限制**
   - 调整 `BATCH_SIZE` 减少并发请求
   - 增加批次间的延迟时间

3. **网络超时**
   - 检查网络连接
   - 重新运行迁移脚本（会跳过已迁移的记录）

### 获取帮助

如果遇到问题，请：
1. 检查浏览器控制台的错误信息
2. 查看迁移报告中的失败记录
3. 确认新旧系统的API端点都可正常访问