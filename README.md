# CloudClipboard 云剪贴板

<div align="center">

![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.5-blue.svg?style=for-the-badge)](https://github.com/your-username/cloudclipboard)

</div>

[中文](#中文) | [English](#english)

---

## 中文

一个基于 Cloudflare D1 数据库的在线剪贴板交换工具，可以存储和管理文本内容，支持本地部署和 Cloudflare Pages 部署两种方式。

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
4. 在 Cloudflare Pages 项目设置中绑定 D1 数据库：
   - 进入项目设置 -> Functions -> D1 database bindings
   - 添加绑定，变量名设置为 `DB`，选择你的 D1 数据库
5. 在 Pages 项目设置中配置环境变量：
   - `JWT_SECRET`: JWT签名密钥（32位以上随机字符串，必需）
   - `ACCESS_PASSWORD`: 访问密码（可选）
   - `CSRF_SECRET`: CSRF密钥（可选，默认使用JWT_SECRET）
6. （可选）配置速率限制：
   - 在Cloudflare Dashboard中创建KV命名空间
   - 在Pages项目Functions设置中绑定KV命名空间为 `RATE_LIMIT_KV`
7. 部署完成后访问你的应用 URL

#### 本地部署
1. 复制 [config/config.default.php](file:///config/config.default.php) 文件为 [config/config.php](file:///config/config.php)：
   ```bash
   cp config/config.default.php config/config.php
   ```

2. 修改 [config/config.php](file:///config/config.php) 文件，填入你的 Cloudflare 配置信息：
   - `CF_ACCOUNT_ID`: Cloudflare 账户 ID
   - `CF_DATABASE_ID`: D1 数据库 ID
   - `CF_API_TOKEN`: Cloudflare API 令牌
   - `TABLE_NAME`: 数据库表名（默认为 clipboard）

3. 访问 `init_db.php` 初始化数据库表结构

4. 部署完成后即可使用

### 使用方法

1. 访问主页，在输入框中输入需要保存的文本内容
2. 点击"保存"按钮或按回车键保存
3. 在列表中查看已保存的内容
4. 可以点击"删除"按钮删除不需要的记录

### 注意事项

- 请确保 [config/config.php](file:///config/config.php) 文件中包含正确的 Cloudflare 配置信息
- 首次使用前需要访问 `init_db.php` 初始化数据库
- 请勿将 [config/config.php](file:///config/config.php) 文件提交到版本控制系统中

### 许可证

本项目采用 MIT 许可证，详情请见 [LICENSE](file:///LICENSE) 文件。

### 致谢

感谢以下工具和平台对本项目的支持：

- [Visual Studio Code](https://code.visualstudio.com/) - 优秀的代码编辑器
- [Cline](https://github.com/cline/cline.git) - AI助手工具
- [通义灵码](https://tongyi.aliyun.com/lingma/) - 阿里巴巴智能编码助手
- [Qwen3-Coder](https://tongyi.aliyun.com/qianwen/) - 阿里巴巴通义实验室研发的超大规模语言模型

### 联系我们

如有任何问题或建议，请访问我们的 [GitHub 仓库](https://github.com/lukechern/CloudClipboard) 提交 Issue 或 Pull Request。

---

## English

An online clipboard tool based on Cloudflare D1 database for storing and managing text content, supporting both local deployment and Cloudflare Pages deployment.

### Features

- Save text content online to the cloud
- View history records in real-time
- Support for deleting specific records
- Based on Cloudflare D1 database, secure and reliable
- Supports both local deployment and Cloudflare Pages deployment

### Deployment Instructions

#### Cloudflare Pages Deployment (Recommended)
1. Fork this repository to your GitHub account
2. Connect your GitHub account in the Cloudflare Pages dashboard
3. Select this repository for deployment
4. Bind D1 database in Cloudflare Pages project settings:
   - Go to project settings -> Functions -> D1 database bindings
   - Add binding with variable name `DB` and select your D1 database
5. Configure environment variables in the Pages project settings:
   - `JWT_SECRET`: JWT signing key (32+ character random string, required)
   - `ACCESS_PASSWORD`: Access password (optional)
   - `CSRF_SECRET`: CSRF secret key (optional, defaults to JWT_SECRET)
6. (Optional) Configure rate limiting:
   - Create a KV namespace in Cloudflare Dashboard
   - Bind the KV namespace as `RATE_LIMIT_KV` in Pages project Functions settings
7. Access your application URL after deployment

#### Local Deployment
1. Copy [config/config.default.php](file:///config/config.default.php) to [config/config.php](file:///config/config.php):
   ```bash
   cp config/config.default.php config/config.php
   ```

2. Modify [config/config.php](file:///config/config.php) file and fill in your Cloudflare configuration:
   - `CF_ACCOUNT_ID`: Cloudflare Account ID
   - `CF_DATABASE_ID`: D1 Database ID
   - `CF_API_TOKEN`: Cloudflare API Token
   - `TABLE_NAME`: Database table name (default: clipboard)

3. Visit `init_db.php` to initialize the database table structure

4. Deployment is complete and ready to use

### Usage

1. Visit the homepage and enter the text content you want to save in the input box
2. Click the "Save" button or press Enter to save
3. View saved content in the list
4. Click the "Delete" button to remove unwanted records

### Important Notes

- Ensure [config/config.php](file:///config/config.php) contains correct Cloudflare configuration information
- Visit `init_db.php` to initialize the database before first use
- Do not commit [config/config.php](file:///config/config.php) to version control systems

### License

This project is licensed under the MIT License. See [LICENSE](file:///LICENSE) file for details.

### Acknowledgments

Thanks to the following tools and platforms for their support:

- [Visual Studio Code](https://code.visualstudio.com/) - Excellent code editor
- [Cline](https://github.com/cline/cline.git) - AI assistant tool
- [Tongyi Lingma](https://tongyi.aliyun.com/lingma/) - Alibaba intelligent coding assistant
- [Qwen3-Coder](https://tongyi.aliyun.com/qianwen/) - Large-scale language model developed by Alibaba Tongyi Lab

### Contact Us

For any questions or suggestions, please visit our [GitHub repository](https://github.com/lukechern/CloudClipboard) to submit Issues or Pull Requests.
### 安全配置


项目已升级到企业级安全系统，提供多层安全防护：

**第一阶段 ✅**:
- **JWT认证**: 替代Base64编码，防止token伪造
- **速率限制**: 防止暴力破解攻击
- **增强体验**: 智能错误提示和倒计时功能

**第二阶段 ✅**:
- **HttpOnly Cookie**: JWT token安全存储，防止XSS攻击
- **CSRF保护**: 防止跨站请求伪造攻击
- **双重认证**: Cookie + CSRF Token双重验证

详细配置方法请参考：
- [安全升级指南](cloudflare-pages-upgrade/SECURITY_UPGRADE.md)
- [第二阶段安全升级](cloudflare-pages-upgrade/SECURITY_PHASE2.md)
- [安全配置指南](cloudflare-pages-upgrade/SECURITY_CONFIG.md)

### Security Configuration

The project has been upgraded to enterprise-level security system with multi-layer protection:

**Phase 1 ✅**:
- **JWT Authentication**: Replaces Base64 encoding, prevents token forgery
- **Rate Limiting**: Prevents brute force attacks  
- **Enhanced UX**: Smart error messages and countdown features

**Phase 2 ✅**:
- **HttpOnly Cookie**: Secure JWT token storage, prevents XSS attacks
- **CSRF Protection**: Prevents cross-site request forgery attacks
- **Dual Authentication**: Cookie + CSRF Token dual verification

For detailed configuration instructions, see:
- [Security Upgrade Guide](cloudflare-pages-upgrade/SECURITY_UPGRADE.md)
- [Phase 2 Security Upgrade](cloudflare-pages-upgrade/SECURITY_PHASE2.md)
- [Security Configuration Guide](cloudflare-pages-upgrade/SECURITY_CONFIG.md)