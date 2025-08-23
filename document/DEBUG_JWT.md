# JWT认证调试指南

## 问题修复总结

### 修复的问题

1. **401错误 - 历史记录无法加载**
   - 原因：`getAuthHeaders()` 方法未实现
   - 修复：在 `auth.js` 中添加了 `getAuthHeaders()` 方法

2. **存储位置显示undefined**
   - 原因：API返回数据处理不当
   - 修复：在 `displayStorageInfo()` 中添加了默认值处理

3. **数据库初始化页面认证问题**
   - 原因：`init.js` 仍使用旧的Base64认证
   - 修复：更新为JWT认证系统

4. **认证成功后token未保存**
   - 原因：验证成功后未设置实例变量
   - 修复：在认证成功处理中正确设置token

### 修复的文件

- `functions/api/init.js` - 更新为JWT认证
- `public/js/auth.js` - 添加getAuthHeaders方法和token保存
- `public/js/main.js` - 修复存储信息显示
- `public/js/init_db.js` - 添加认证等待机制

## 调试方法

### 1. 检查认证状态

在浏览器控制台执行：
```javascript
// 检查认证管理器状态
console.log('认证管理器存在:', !!window.authManager);
console.log('已认证:', window.authManager?.isAuthenticated);
console.log('Token存在:', !!window.authManager?.authToken);

// 检查存储的认证信息
const authData = localStorage.getItem('cloudclipboard_auth');
if (authData) {
    const parsed = JSON.parse(authData);
    console.log('存储的认证类型:', parsed.type);
    console.log('Token长度:', parsed.token?.length);
}
```

### 2. 检查API请求头

在Network标签页中查看API请求：
- 确认请求头包含 `Authorization: Bearer [token]`
- 检查token格式是否正确（JWT格式：xxx.yyy.zzz）

### 3. 测试JWT token

```javascript
// 手动测试API调用
const headers = window.authManager.getAuthHeaders();
console.log('认证头:', headers);

fetch('/api/records', { headers })
    .then(response => {
        console.log('响应状态:', response.status);
        return response.json();
    })
    .then(data => console.log('响应数据:', data))
    .catch(error => console.error('请求失败:', error));
```

### 4. 检查JWT token内容

```javascript
// 解析JWT payload（仅用于调试）
function parseJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload;
    } catch (error) {
        return null;
    }
}

const token = window.authManager?.authToken;
if (token) {
    const payload = parseJWT(token);
    console.log('JWT payload:', payload);
    console.log('过期时间:', new Date(payload.exp * 1000));
}
```

## 常见问题排查

### Q: 仍然收到401错误
**检查步骤:**
1. 确认JWT_SECRET环境变量已设置
2. 确认项目已重新部署
3. 清除浏览器缓存和localStorage
4. 重新登录获取新token

### Q: 存储信息仍显示undefined
**检查步骤:**
1. 在Network标签页查看/api/storage的响应
2. 确认API返回了正确的数据结构
3. 检查是否有认证错误

### Q: 数据库初始化页面无法访问
**检查步骤:**
1. 确认init.js已更新为JWT认证
2. 检查认证管理器是否正确加载
3. 查看控制台是否有JavaScript错误

## 测试流程

### 完整测试步骤

1. **清除缓存测试**
   ```javascript
   // 清除所有认证信息
   localStorage.removeItem('cloudclipboard_auth');
   location.reload();
   ```

2. **登录测试**
   - 输入正确密码
   - 检查是否收到JWT token
   - 验证token是否保存到localStorage

3. **API调用测试**
   - 测试/api/records（历史记录）
   - 测试/api/storage（存储信息）
   - 测试/api/init（数据库初始化）

4. **功能测试**
   - 保存新内容
   - 查看历史记录
   - 访问数据库初始化页面

### 自动化测试脚本

```javascript
// 完整功能测试
async function testAllFeatures() {
    console.log('开始功能测试...');
    
    // 1. 检查认证状态
    console.log('1. 认证状态:', window.authManager?.isAuthenticated);
    
    // 2. 测试API调用
    const headers = window.authManager?.getAuthHeaders() || {};
    
    try {
        // 测试records API
        const recordsResponse = await fetch('/api/records', { headers });
        console.log('2. Records API状态:', recordsResponse.status);
        
        // 测试storage API
        const storageResponse = await fetch('/api/storage', { headers });
        console.log('3. Storage API状态:', storageResponse.status);
        
        // 测试init API
        const initResponse = await fetch('/api/init', { headers });
        console.log('4. Init API状态:', initResponse.status);
        
        console.log('功能测试完成');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 运行测试
testAllFeatures();
```

## 部署检查清单

部署后请确认：

- [ ] JWT_SECRET环境变量已设置
- [ ] 项目已重新部署
- [ ] 登录功能正常
- [ ] 历史记录可以加载
- [ ] 存储信息正确显示
- [ ] 数据库初始化页面可访问
- [ ] 新内容可以保存
- [ ] 速率限制功能正常（可选）

## 性能监控

### 关键指标

- JWT生成时间：< 5ms
- JWT验证时间：< 5ms
- API响应时间：< 200ms
- 认证成功率：> 99%

### 监控代码

```javascript
// 性能监控
const performanceMonitor = {
    startTime: null,
    
    start(operation) {
        this.startTime = performance.now();
        console.log(`开始 ${operation}...`);
    },
    
    end(operation) {
        if (this.startTime) {
            const duration = performance.now() - this.startTime;
            console.log(`${operation} 完成，耗时: ${duration.toFixed(2)}ms`);
            this.startTime = null;
        }
    }
};

// 使用示例
performanceMonitor.start('JWT认证');
// ... 认证代码 ...
performanceMonitor.end('JWT认证');
```

---

**注意**: 这个调试指南仅用于开发和测试环境，生产环境中请移除调试代码。