# 批量删除调试指南

## 问题诊断

批量删除失败可能的原因：

1. **CSRF Token缺失或无效**
2. **认证状态问题**
3. **请求格式错误**
4. **服务器端验证失败**

## 调试步骤

### 1. 检查认证状态

在浏览器控制台执行：

```javascript
// 检查认证管理器状态
console.log('认证状态检查:', {
    authManagerExists: !!window.authManager,
    isAuthenticated: window.authManager?.isAuthenticated,
    usesCookies: window.authManager?.usesCookies,
    hasCSRFToken: !!window.authManager?.csrfToken,
    csrfToken: window.authManager?.csrfToken?.substring(0, 20) + '...',
    authHeaders: window.authManager?.getAuthHeaders()
});
```

### 2. 测试单个删除请求

```javascript
// 测试单个删除请求
async function testSingleDelete(recordId) {
    console.log('测试删除记录:', recordId);
    
    const requestConfig = window.authManager.getRequestConfig({
        method: 'DELETE'
    });
    
    console.log('请求配置:', requestConfig);
    
    try {
        const response = await fetch(`/api/records?id=${recordId}`, requestConfig);
        const data = await response.json();
        
        console.log('删除结果:', {
            status: response.status,
            ok: response.ok,
            data: data
        });
        
        return response.ok;
    } catch (error) {
        console.error('删除请求失败:', error);
        return false;
    }
}

// 使用示例：替换123为实际的记录ID
// testSingleDelete(123);
```

### 3. 检查CSRF Token有效性

```javascript
// 检查CSRF token
function checkCSRFToken() {
    const csrfToken = window.authManager?.csrfToken;
    
    if (!csrfToken) {
        console.error('❌ CSRF token不存在');
        return false;
    }
    
    console.log('✅ CSRF token存在:', csrfToken.substring(0, 20) + '...');
    
    // 检查token格式
    const parts = csrfToken.split('.');
    if (parts.length !== 2) {
        console.error('❌ CSRF token格式错误');
        return false;
    }
    
    console.log('✅ CSRF token格式正确');
    return true;
}

checkCSRFToken();
```

### 4. 模拟批量删除请求

```javascript
// 模拟批量删除（用于调试）
async function debugBatchDelete(ids) {
    console.log('🔍 开始调试批量删除...');
    console.log('要删除的ID:', ids);
    
    // 检查认证状态
    if (!window.authManager?.isAuthenticated) {
        console.error('❌ 用户未认证');
        return;
    }
    
    // 检查CSRF token
    if (!checkCSRFToken()) {
        return;
    }
    
    // 获取请求配置
    const requestConfig = window.authManager.getRequestConfig({
        method: 'DELETE'
    });
    
    console.log('📤 请求配置:', requestConfig);
    
    // 逐个测试删除请求
    for (const id of ids) {
        console.log(`\n🗑️ 测试删除记录 ${id}...`);
        
        try {
            const response = await fetch(`/api/records?id=${id}`, requestConfig);
            const data = await response.json().catch(() => ({}));
            
            if (response.ok) {
                console.log(`✅ 记录 ${id} 删除成功`);
            } else {
                console.error(`❌ 记录 ${id} 删除失败:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error
                });
            }
        } catch (error) {
            console.error(`❌ 记录 ${id} 请求失败:`, error);
        }
    }
}

// 使用示例：替换为实际的记录ID数组
// debugBatchDelete([1, 2, 3]);
```

## 常见问题解决

### 问题1: CSRF token缺失

**现象**: 控制台显示 "Missing CSRF token"

**解决方案**:
```javascript
// 重新获取CSRF token
async function refreshCSRFToken() {
    try {
        // 重新登录以获取新的CSRF token
        window.authManager.logout();
    } catch (error) {
        console.error('刷新CSRF token失败:', error);
    }
}
```

### 问题2: 认证状态异常

**现象**: 认证管理器显示已认证，但请求被拒绝

**解决方案**:
```javascript
// 清除认证状态并重新登录
localStorage.removeItem('cloudclipboard_auth');
document.cookie.split(";").forEach(c => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
});
location.reload();
```

### 问题3: 请求头问题

**现象**: 请求发送但服务器无法识别CSRF token

**解决方案**:
```javascript
// 手动构造请求头
async function manualDeleteRequest(recordId) {
    const headers = {
        'X-CSRF-Token': window.authManager.csrfToken
    };
    
    // 如果不使用Cookie模式，添加Authorization头
    if (!window.authManager.usesCookies && window.authManager.authToken) {
        headers['Authorization'] = `Bearer ${window.authManager.authToken}`;
    }
    
    const response = await fetch(`/api/records?id=${recordId}`, {
        method: 'DELETE',
        headers: headers,
        credentials: window.authManager.usesCookies ? 'same-origin' : 'omit'
    });
    
    return response;
}
```

## 服务器端调试

如果前端调试无法解决问题，可能需要检查服务器端：

### 1. 检查环境变量

确保以下环境变量已正确设置：
- `JWT_SECRET`: JWT签名密钥
- `CSRF_SECRET`: CSRF签名密钥（可选，默认使用JWT_SECRET）

### 2. 检查CSRF验证逻辑

服务器端CSRF验证的顺序：
1. 从 `X-CSRF-Token` 请求头获取
2. 从表单数据获取（POST请求）
3. 从URL参数获取（DELETE请求）

### 3. 检查JWT验证

确保JWT token验证正常工作：
- Cookie中的token是否有效
- 会话ID是否匹配
- Token是否过期

## 临时解决方案

如果问题持续存在，可以临时禁用CSRF验证进行测试：

```javascript
// 临时修改records.js中的checkAuth调用
// 将 checkAuth(request, env, true) 改为 checkAuth(request, env, false)
// 注意：这只是临时调试方案，不要在生产环境使用
```

## 完整测试脚本

```javascript
// 完整的批量删除测试脚本
async function fullBatchDeleteTest() {
    console.log('🚀 开始完整的批量删除测试...\n');
    
    // 1. 检查环境
    console.log('1️⃣ 环境检查:');
    console.log('- 认证管理器:', !!window.authManager);
    console.log('- 已认证:', window.authManager?.isAuthenticated);
    console.log('- Cookie模式:', window.authManager?.usesCookies);
    console.log('- CSRF Token:', !!window.authManager?.csrfToken);
    
    if (!window.authManager?.isAuthenticated) {
        console.error('❌ 测试终止：用户未认证');
        return;
    }
    
    // 2. 获取记录列表
    console.log('\n2️⃣ 获取记录列表...');
    try {
        const recordsResponse = await fetch('/api/records', 
            window.authManager.getRequestConfig()
        );
        const records = await recordsResponse.json();
        
        if (records.length === 0) {
            console.log('📝 没有记录可供测试');
            return;
        }
        
        console.log(`📋 找到 ${records.length} 条记录`);
        
        // 3. 测试删除第一条记录
        const testId = records[0].id;
        console.log(`\n3️⃣ 测试删除记录 ${testId}...`);
        
        const success = await testSingleDelete(testId);
        if (success) {
            console.log('✅ 单个删除测试成功');
        } else {
            console.error('❌ 单个删除测试失败');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
    }
}

// 运行完整测试
fullBatchDeleteTest();
```

---

**注意**: 这些调试脚本仅用于开发和测试环境。在生产环境中请谨慎使用，避免意外删除重要数据。