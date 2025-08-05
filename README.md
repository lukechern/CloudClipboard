# CloudClipboard 云剪贴板

<div align="center">

![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.1-blue.svg?style=for-the-badge)](https://github.com/your-username/cloudclipboard)

</div>

[中文](#中文) | [English](#english)

---

## 中文

一个基于 Cloudflare D1 数据库的在线剪贴板工具，可以存储和管理文本内容，支持本地部署和 Cloudflare Pages 部署两种方式。

### 功能特点

- 在线保存文本内容到云端
- 实时查看历史记录
- 支持删除指定记录
- 基于 Cloudflare D1 数据库，安全可靠
- 支持本地部署和 Cloudflare Pages 部署双重部署方式

### 部署说明

#### Cloudflare Pages 部署（推荐）
1. Fork 本项目到你的 GitHub 账户
2. 在 Cloudflare Pages 控制台中连接你的 GitHub 账户
3. 选择本项目仓库进行部署
4. 在 Pages 项目设置中配置环境变量：
   - `CF_ACCOUNT_ID`: Cloudflare 账户 ID
   - `CF_DATABASE_ID`: D1 数据库 ID
   - `CF_API_TOKEN`: Cloudflare API 令牌
   - `TABLE_NAME`: 数据库表名（默认为 clipboard）
5. 部署完成后访问你的应用 URL

#### 本地部署
1. 复制 [config/config.default.php](file:///config/config.default.php) 文件为 [config/config.php](file:///config/config.php)：
   ```bash
   cp config/config.default.php config/config.php