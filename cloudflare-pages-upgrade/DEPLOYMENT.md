# CloudClipboard - Cloudflare Pages 部署指南

## 前置条件

1. **Cloudflare账户**：需要有Cloudflare账户
2. **D1数据库**：已创建的Cloudflare D1数据库
3. **GitHub仓库**：代码托管在GitHub上

## 部署步骤

### 1. 准备D1数据库

```bash
# 创建D1数据库
wrangler d1 create cloudclipboard

# 记录返回的database_id，后续配置需要用到
```

### 2. 配置项目

编辑 `wrangler.toml` 文件，更新数据库配置：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cloudclipboard"
database_id = "your-actual-database-id-here"  # 替换为实际的数据库ID
```

### 3. 部署到Cloudflare Pages

#### 方法一：通过Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Pages" 部分
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 选择你的GitHub仓库
6. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: `npm install`
   - **Build output directory**: `public`
   - **Root directory**: `cloudflare-pages-upgrade`

#### 方法二：通过Wrangler CLI

```bash
# 安装依赖
npm install

# 部署到Pages
npm run deploy
```

### 4. 配置环境变量

在Cloudflare Pages项目设置中：

1. 进入 "Settings" → "Environment variables"
2. 添加以下环境变量：
   - **ACCESS_PASSWORD**: 设置访问密码（可选，不设置则无密码保护）

### 5. 绑定D1数据库

在Cloudflare Pages项目设置中：

1. 进入 "Settings" → "Functions"
2. 在 "D1 database bindings" 部分添加：
   - **Variable name**: `DB`
   - **D1 database**: 选择你创建的数据库

### 6. 初始化数据库

部署完成后：

1. 访问 `https://your-domain.pages.dev/init_db.html`
2. 如果设置了密码，输入访问密码
3. 点击 "创建数据库表" 按钮
4. 确认表创建成功

### 7. 测试功能

1. 访问主页 `https://your-domain.pages.dev`
2. 如果设置了密码，首次访问需要输入密码
3. 测试保存文本内容
4. 测试查看历史记录
5. 测试复制和删除功能

## 环境变量配置

可以在Cloudflare Pages设置中添加以下环境变量：

- `TABLE_NAME`: 数据库表名（默认：cloudclipboard）
- `ACCESS_PASSWORD`: 访问密码（可选，不设置则无密码保护）

### 密码保护功能

- **启用密码保护**: 在环境变量中设置 `ACCESS_PASSWORD`
- **密码存储**: 用户输入正确密码后，会加密保存在浏览器本地存储中
- **自动登录**: 7天内无需重复输入密码
- **安全性**: 密码使用Base64编码存储，并在每次API请求中验证

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查D1数据库是否正确绑定
   - 确认database_id是否正确

2. **API请求失败**
   - 检查Functions是否正确部署
   - 查看Functions日志排查错误

3. **静态资源加载失败**
   - 确认文件路径是否正确
   - 检查public目录结构

### 查看日志

```bash
# 查看Pages部署日志
wrangler pages deployment list

# 查看Functions日志
wrangler pages deployment tail
```

## 性能优化

1. **启用缓存**：Cloudflare自动为静态资源启用CDN缓存
2. **压缩资源**：可以考虑压缩CSS和JS文件
3. **图片优化**：使用WebP格式的图片

## 安全考虑

1. **CORS设置**：根据需要配置CORS策略
2. **访问控制**：可以添加基本的访问控制
3. **数据验证**：确保输入数据的验证和清理

## 监控和维护

1. **监控指标**：通过Cloudflare Analytics查看访问情况
2. **错误追踪**：设置错误通知和日志记录
3. **定期备份**：考虑定期备份D1数据库数据