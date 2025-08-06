# CloudClipboard 安全配置指南

## 概述

本文档详细说明如何在Cloudflare Pages控制台配置CloudClipboard的安全参数，包括JWT认证和速率限制功能的环境变量设置。

## 前置要求

- 已有Cloudflare账户
- CloudClipboard项目已部署到Cloudflare Pages
- 具有项目管理权限

## 配置步骤

### 第一步：访问Cloudflare Dashboard

1. 打开浏览器，访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 使用你的Cloudflare账户登录
3. 等待Dashboard加载完成

### 第二步：进入Pages项目管理

1. 在左侧导航栏中点击 **"Pages"**
2. 在项目列表中找到你的CloudClipboard项目
3. 点击项目名称进入项目详情页面

### 第三步：进入环境变量设置

1. 在项目详情页面，点击顶部的 **"Settings"** 标签页
2. 在左侧设置菜单中选择 **"Environment variables"**
3. 你将看到两个环境选项：
   - **Production** (生产环境) - 正式访问时使用
   - **Preview** (预览环境) - 预览部署时使用

## 环境变量配置

### 必需配置

#### 1. JWT_SECRET（JWT签名密钥）

**用途**: 用于JWT token的签名和验证，确保token安全性

**配置步骤**:
1. 在 **Production** 环境中点击 **"Add variable"** 按钮
2. 填写变量信息：
   - **Variable name**: `JWT_SECRET`
   - **Value**: 输入32位以上的安全随机字符串
3. 点击 **"Save"** 保存
4. 在 **Preview** 环境中重复相同操作

**JWT_SECRET生成方法**:

**方法一：在线生成器**
- 访问 [https://www.uuidgenerator.net/](https://www.uuidgenerator.net/)
- 选择生成32位或更长的随机字符串
- 复制生成的字符串

**方法二：Node.js命令行**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法三：手动创建示例**
```
CloudClipboard-JWT-Secret-2024-32chars-min
your-super-secret-jwt-key-here-32chars-min
cc-jwt-2024-abcdef1234567890-security-key
```

**安全要求**:
- ✅ 至少32个字符
- ✅ 包含字母、数字
- ✅ 可包含特殊字符（-、_等）
- ❌ 不要使用简单的单词或日期
- ❌ 不要在代码中硬编码

### 现有配置

#### 2. ACCESS_PASSWORD（访问密码）

**用途**: 用户访问CloudClipboard时需要输入的密码

**配置步骤**:
1. 如果之前已设置，确保该变量仍然存在
2. 如果需要新增或修改：
   - **Variable name**: `ACCESS_PASSWORD`
   - **Value**: 你的访问密码
3. 如果不设置此变量，则无需密码即可访问

**密码建议**:
- 使用强密码（8位以上）
- 包含大小写字母、数字、特殊字符
- 定期更换密码

### 可选配置（速率限制功能）

#### 3. KV命名空间绑定

**用途**: 存储速率限制数据，防止暴力破解攻击

**第一步：创建KV命名空间**
1. 在Cloudflare Dashboard左侧导航栏点击 **"Workers & Pages"**
2. 点击 **"KV"** 标签页
3. 点击 **"Create a namespace"** 按钮
4. 输入命名空间名称：`cloudclipboard-rate-limit`
5. 点击 **"Add"** 创建命名空间

**第二步：绑定KV命名空间**
1. 回到CloudClipboard项目的Settings页面
2. 在左侧菜单中选择 **"Functions"**
3. 滚动到页面中的 **"KV namespace bindings"** 部分
4. 点击 **"Add binding"** 按钮
5. 填写绑定信息：
   - **Variable name**: `RATE_LIMIT_KV`
   - **KV namespace**: 选择刚创建的 `cloudclipboard-rate-limit`
6. 点击 **"Save"** 保存绑定

**速率限制参数**:
- 最大尝试次数：5次
- 时间窗口：15分钟
- 封锁时长：1小时

## 部署和验证

### 重新部署项目

配置完环境变量后，需要重新部署以使配置生效：

**方法一：手动重新部署**
1. 在项目详情页点击 **"Deployments"** 标签页
2. 找到最新的部署记录
3. 点击右侧的 **"Retry deployment"** 按钮
4. 等待部署完成

**方法二：触发自动部署**
1. 向GitHub仓库推送任意代码更改
2. Cloudflare Pages会自动触发新的部署

### 配置验证

#### 1. 功能验证

**JWT认证验证**:
1. 访问你的CloudClipboard网址
2. 如果设置了ACCESS_PASSWORD，应该看到密码输入界面
3. 输入正确密码，应该能正常进入应用
4. 关闭浏览器重新打开，在7天内应该无需重新输入密码

**速率限制验证**:
1. 故意输入错误密码
2. 连续尝试5次后，应该看到限制提示
3. 提示信息应显示剩余尝试次数和封锁时间

#### 2. 技术验证

**检查JWT Token**:
打开浏览器开发者工具（F12），在Console中执行：
```javascript
// 检查认证数据
const authData = localStorage.getItem('cloudclipboard_auth');
if (authData) {
    const parsed = JSON.parse(authData);
    console.log('认证类型:', parsed.type); // 应该显示 'jwt'
    console.log('Token长度:', parsed.token.length); // JWT token通常较长
}
```

**检查API响应**:
1. 在Network标签页中查看API请求
2. 认证成功的响应应包含JWT token
3. 速率限制触发时应返回429状态码

## 配置总览

### 完整配置清单

**生产环境 (Production)**:
```
环境变量:
├── JWT_SECRET = [32位以上随机字符串]
├── ACCESS_PASSWORD = [你的访问密码] (可选)

KV绑定:
└── RATE_LIMIT_KV -> cloudclipboard-rate-limit (可选)
```

**预览环境 (Preview)**:
```
环境变量:
├── JWT_SECRET = [与生产环境相同]
├── ACCESS_PASSWORD = [与生产环境相同] (可选)

KV绑定:
└── RATE_LIMIT_KV -> cloudclipboard-rate-limit (可选)
```

### 配置状态检查

| 配置项 | 状态检查 | 预期结果 |
|--------|----------|----------|
| JWT_SECRET | 必需 | ✅ 已设置32位以上字符串 |
| ACCESS_PASSWORD | 可选 | ✅ 已设置强密码 或 ❌ 未设置（公开访问） |
| RATE_LIMIT_KV | 可选 | ✅ 已绑定KV命名空间 或 ❌ 未绑定（无速率限制） |

## 故障排除

### 常见问题及解决方案

#### Q1: 设置JWT_SECRET后仍然报错
**现象**: 控制台显示JWT相关错误
**原因**: 环境变量未生效或部署未完成
**解决方案**:
1. 确认环境变量已正确保存
2. 手动触发重新部署
3. 等待部署完全完成后再测试

#### Q2: 速率限制功能不工作
**现象**: 可以无限次尝试错误密码
**原因**: KV命名空间未正确绑定
**解决方案**:
1. 检查KV命名空间是否已创建
2. 确认绑定名称为 `RATE_LIMIT_KV`
3. 检查绑定是否指向正确的命名空间

#### Q3: 用户频繁需要重新登录
**现象**: JWT token经常过期
**原因**: 可能是系统时间不同步或token生成有问题
**解决方案**:
1. 检查JWT_SECRET是否正确设置
2. 查看浏览器控制台是否有相关错误
3. 清除浏览器缓存重新测试

#### Q4: 无法访问环境变量设置页面
**现象**: 找不到Environment variables选项
**原因**: 权限不足或项目类型不正确
**解决方案**:
1. 确认你有项目管理权限
2. 确认项目是Pages项目而非Workers项目
3. 联系项目所有者获取权限

### 调试方法

#### 1. 检查环境变量是否生效
在Functions代码中添加临时日志：
```javascript
console.log('JWT_SECRET exists:', !!env.JWT_SECRET);
console.log('ACCESS_PASSWORD exists:', !!env.ACCESS_PASSWORD);
console.log('RATE_LIMIT_KV exists:', !!env.RATE_LIMIT_KV);
```

#### 2. 检查KV命名空间连接
在Cloudflare Dashboard的KV页面查看命名空间是否有数据写入。

#### 3. 检查部署日志
在Deployments页面查看最新部署的日志，确认没有错误。

## 安全最佳实践

### 1. 密钥管理
- 🔐 定期更换JWT_SECRET（建议每6个月）
- 🔐 不要在代码中硬编码密钥
- 🔐 不要在公开场合分享密钥
- 🔐 使用强随机字符串作为密钥

### 2. 访问控制
- 🛡️ 设置强访问密码
- 🛡️ 定期更换访问密码
- 🛡️ 启用速率限制防止暴力破解
- 🛡️ 监控异常访问行为

### 3. 部署安全
- 🚀 在Preview环境测试后再部署到Production
- 🚀 保持环境变量在两个环境中同步
- 🚀 定期检查配置状态
- 🚀 备份重要的配置信息

## 维护计划

### 定期维护任务

**每月检查**:
- [ ] 验证所有环境变量是否正常工作
- [ ] 检查KV命名空间使用情况
- [ ] 查看访问日志是否有异常

**每季度更新**:
- [ ] 更换ACCESS_PASSWORD
- [ ] 检查JWT_SECRET是否需要更新
- [ ] 清理过期的KV数据

**每年审查**:
- [ ] 全面更换JWT_SECRET
- [ ] 审查安全配置是否符合最新标准
- [ ] 更新文档和配置指南

## 联系支持

如果在配置过程中遇到问题：

1. **查看官方文档**: [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)
2. **检查项目Issues**: 在GitHub项目页面查看相关问题
3. **社区支持**: Cloudflare社区论坛
4. **技术支持**: 如果是付费用户，可联系Cloudflare技术支持

---

**文档版本**: v1.0  
**最后更新**: 2024年  
**适用版本**: CloudClipboard v2.2+