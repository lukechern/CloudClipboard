# 快速开始指南

## 5分钟部署CloudClipboard

### 步骤1: 创建D1数据库

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 创建D1数据库
wrangler d1 create cloudclipboard
```

记录返回的`database_id`，例如：`abc123-def456-ghi789`

### 步骤2: 配置项目

编辑 `wrangler.toml` 文件：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cloudclipboard"
database_id = "abc123-def456-ghi789"  # 替换为你的数据库ID
```

### 步骤3: 部署到Cloudflare Pages

#### 方法A: 通过GitHub（推荐）

1. 将代码推送到GitHub仓库
2. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Pages** → **Create a project** → **Connect to Git**
4. 选择你的仓库，配置：
   - **Build command**: `npm install`
   - **Build output directory**: `public`
   - **Root directory**: `cloudflare-pages-upgrade`

#### 方法B: 直接部署

```bash
cd cloudflare-pages-upgrade
npm install
npm run deploy
```

### 步骤4: 绑定数据库

在Cloudflare Pages项目中：

1. **Settings** → **Functions**
2. **D1 database bindings** → **Add binding**
3. **Variable name**: `DB`
4. **D1 database**: 选择你创建的数据库

### 步骤5: 设置密码保护（可选）

1. **Settings** → **Environment variables**
2. **Add variable**:
   - **Name**: `ACCESS_PASSWORD`
   - **Value**: `your-secret-password`

### 步骤6: 初始化数据库

1. 访问 `https://your-domain.pages.dev/init_db.html`
2. 如果设置了密码，输入密码
3. 点击 **创建数据库表**

### 步骤7: 开始使用

访问 `https://your-domain.pages.dev` 开始使用你的云剪贴板！

## 常用命令

```bash
# 本地开发
npm run dev

# 部署到Pages
npm run deploy

# 查看D1数据库内容
wrangler d1 execute cloudclipboard --command "SELECT * FROM cloudclipboard"

# 清空数据库
wrangler d1 execute cloudclipboard --command "DELETE FROM cloudclipboard"
```

## 故障排除

### 问题1: 数据库连接失败
- 检查 `wrangler.toml` 中的 `database_id` 是否正确
- 确认D1数据库绑定是否正确配置

### 问题2: 密码验证不工作
- 检查环境变量 `ACCESS_PASSWORD` 是否设置
- 确认项目已重新部署

### 问题3: 页面无法访问
- 检查域名是否正确
- 确认Pages项目部署状态

## 下一步

- 📖 阅读 [完整部署指南](DEPLOYMENT.md)
- 🔐 了解 [密码保护功能](PASSWORD_PROTECTION.md)
- 🏗️ 查看 [项目结构说明](PROJECT_STRUCTURE.md)
- 📊 对比 [版本差异](UPGRADE_COMPARISON.md)