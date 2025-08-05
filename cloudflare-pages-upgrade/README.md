# CloudClipboard - Cloudflare Pages 升级版

## 项目概述

这是原PHP版本CloudClipboard的升级版本，专为Cloudflare Pages + Workers架构设计。

## 架构说明

- **前端**: 静态HTML/CSS/JS部署到Cloudflare Pages
- **后端**: Cloudflare Workers处理API请求
- **数据库**: Cloudflare D1数据库
- **部署**: 通过Cloudflare Pages自动部署

## 项目结构

```
cloudflare-pages-upgrade/
├── public/                 # 静态资源 (部署到Pages)
│   ├── index.html         # 主页面
│   ├── init_db.html       # 数据库初始化页面
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript文件
│   └── img/               # 图片资源
├── functions/             # Cloudflare Pages Functions (Workers)
│   └── api/               # API路由
│       ├── records.js     # 记录相关API
│       ├── storage.js     # 存储信息API
│       └── init.js        # 数据库初始化API
├── wrangler.toml          # Cloudflare配置文件
└── package.json           # 项目依赖
```

## 部署步骤

1. **配置环境变量**
   在Cloudflare Pages项目设置中添加：
   - `CF_ACCOUNT_ID`: Cloudflare账户ID
   - `CF_DATABASE_ID`: D1数据库ID
   - `CF_API_TOKEN`: Cloudflare API令牌

2. **部署到Cloudflare Pages**
   - 连接GitHub仓库
   - 设置构建命令: `npm install`
   - 设置输出目录: `public`

3. **绑定D1数据库**
   在wrangler.toml中配置D1数据库绑定

## 主要改进

- ✅ 无服务器架构，自动扩缩容
- ✅ 全球CDN加速
- ✅ 更好的性能和可靠性
- ✅ 简化的部署流程
- ✅ 保持原有功能不变