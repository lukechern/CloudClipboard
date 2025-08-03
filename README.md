# CloudClipboard 云剪贴板

<div align="center">

![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2-blue.svg?style=for-the-badge)](https://github.com/your-username/cloudclipboard)

</div>


一个基于 Cloudflare D1 数据库的在线剪贴板工具，可以存储和管理文本内容。

## 功能特点

- 在线保存文本内容到云端
- 实时查看历史记录
- 支持删除指定记录
- 基于 Cloudflare D1 数据库，安全可靠

## 部署说明

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

## 使用方法

1. 访问主页，在输入框中输入需要保存的文本内容
2. 点击"保存"按钮或按回车键保存
3. 在列表中查看已保存的内容
4. 可以点击"删除"按钮删除不需要的记录

## 注意事项

- 请确保 [config/config.php](file:///config/config.php) 文件中包含正确的 Cloudflare 配置信息
- 首次使用前需要访问 `init_db.php` 初始化数据库
- 请勿将 [config/config.php](file:///config/config.php) 文件提交到版本控制系统中

## 许可证

本项目采用 MIT 许可证，详情请见 [LICENSE](file:///LICENSE) 文件。

## 致谢

感谢以下工具和平台对本项目的支持：

- [Visual Studio Code](https://code.visualstudio.com/) - 优秀的代码编辑器
- [Cline](https://github.com/cline/cline.git) - AI助手工具
- [通义灵码](https://tongyi.aliyun.com/lingma/) - 阿里巴巴智能编码助手
- [Qwen3-Coder](https://tongyi.aliyun.com/qianwen/) - 阿里巴巴通义实验室研发的超大规模语言模型

## 联系我们

如有任何问题或建议，请访问我们的 [GitHub 仓库](https://github.com/lukechern/CloudClipboard) 提交 Issue 或 Pull Request。
