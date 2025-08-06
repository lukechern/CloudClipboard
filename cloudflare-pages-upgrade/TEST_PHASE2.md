# 第二阶段安全功能测试指南

## 测试概述

本文档提供第二阶段安全功能（HttpOnly Cookie + CSRF保护）的完整测试方法。

## 自动化测试脚本

### 完整功能测试

在浏览器控制台中运行以下脚本：

```javascript
// 第二阶段安全功能测试套件
class SecurityPhase2Tester {
    constructor() {
        this.results = [];
        this.authManager = window.authManager;
    }

    // 记录测试结果
    log(test, status, message) {
        const result = { test, status, message, timestamp: new Date() };
        this.results.push(result);
        console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
    }

    // 检查Cookie设置
    async testCookieSetup() {
        console.log('\n🍪 测试Cookie设置...');
        
        // 检查认证Cookie
        const cookies = document.cookie.split(';').map(c => c.trim());
        const authCookie = cookies.find(c => c.startsWith('cc_auth_token='));
        const csrfCookie = cookies.find(c => c.startsWith('cc_csrf_token='));
        
        if (authCookie) {
            this.log('Auth Cookie', 'PASS', '认证Cookie已设置');
        } else {
            this.log('Auth Cookie', 'FAIL', '认证Cookie未找到');
        }
        
        if (csrfCookie) {
            this.log('CSRF Cookie', 'PASS', 'CSRF Cookie已设置');
        } else {
            this.log('CSRF Cookie', 'FAIL', 'CSRF Cookie未找到');
        }
    }

    // 检查认证管理器状态
    async testAuthManagerState() {
        console.log('\n🔐 测试认证管理器状态...');
        
        if (!this.authManager) {
            this.log('AuthManager', 'FAIL', '认证管理器未找到');
            return;
        }
        
        this.log('AuthManager Exists', 'PASS', '认证管理器已加载');
        this.log('Is Authenticated', this.authManager.isAuthenticated ? 'PASS' : 'FAIL', 
                `认证状态: ${this.authManager.isAuthenticated}`);
        this.log('Uses Cookies', this.authManager.usesCookies ? 'PASS' : 'INFO', 
                `Cookie模式: ${this.authManager.usesCookies}`);
        this.log('Has CSRF Token', this.authManager.csrfToken ? 'PASS' : 'FAIL', 
                `CSRF Token: ${this.authManager.csrfToken ? '已设置' : '未设置'}`);
    }

    // 测试API调用
    async testAPIRequests() {
        console.log('\n🌐 测试API调用...');
        
        try {
            // 测试GET请求（不需要CSRF）
            const getConfig = this.authManager.getRequestConfig();
            const getResponse = await fetch('/api/records', getConfig);
            
            this.log('GET Request', getResponse.ok ? 'PASS' : 'FAIL', 
                    `GET /api/records: ${getResponse.status}`);
            
            // 检查请求头
            const headers = this.authManager.getAuthHeaders();
            if (headers['X-CSRF-Token']) {
                this.log('CSRF Header', 'PASS', 'CSRF token在请求头中');
            } else {
                this.log('CSRF Header', 'FAIL', 'CSRF token缺失');
            }
            
            // 测试存储信息API
            const storageResponse = await fetch('/api/storage', getConfig);
            this.log('Storage API', storageResponse.ok ? 'PASS' : 'FAIL', 
                    `GET /api/storage: ${storageResponse.status}`);
            
        } catch (error) {
            this.log('API Requests', 'FAIL', `请求失败: ${error.message}`);
        }
    }

    // 测试CSRF保护
    async testCSRFProtection() {
        console.log('\n🛡️ 测试CSRF保护...');
        
        try {
            // 尝试不带CSRF token的POST请求
            const response = await fetch('/api/records', {
                method: 'POST',
                body: new FormData(),
                credentials: 'same-origin'
            });
            
            if (response.status === 401) {
                this.log('CSRF Protection', 'PASS', 'CSRF保护生效，拒绝无token请求');
            } else {
                this.log('CSRF Protection', 'FAIL', 'CSRF保护未生效');
            }
            
        } catch (error) {
            this.log('CSRF Protection', 'INFO', `测试过程中出现错误: ${error.message}`);
        }
    }

    // 测试Cookie安全属性
    async testCookieSecurity() {
        console.log('\n🔒 测试Cookie安全属性...');
        
        // 尝试通过JavaScript访问HttpOnly Cookie
        try {
            const cookies = document.cookie;
            const hasAuthToken = cookies.includes('cc_auth_token=');
            
            if (!hasAuthToken) {
                this.log('HttpOnly Protection', 'PASS', 'HttpOnly Cookie无法通过JavaScript访问');
            } else {
                this.log('HttpOnly Protection', 'FAIL', 'HttpOnly Cookie可以被JavaScript访问');
            }
        } catch (error) {
            this.log('HttpOnly Protection', 'PASS', 'Cookie访问被阻止');
        }
    }

    // 测试向后兼容性
    async testBackwardCompatibility() {
        console.log('\n🔄 测试向后兼容性...');
        
        // 检查是否仍支持Authorization header
        try {
            const response = await fetch('/api/records', {
                headers: {
                    'Authorization': `Bearer ${this.authManager.authToken || 'test-token'}`
                }
            });
            
            // 如果使用Cookie模式，Authorization header应该被忽略但不报错
            this.log('Header Compatibility', 'PASS', 'Authorization header兼容性正常');
            
        } catch (error) {
            this.log('Header Compatibility', 'FAIL', `兼容性测试失败: ${error.message}`);
        }
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始第二阶段安全功能测试...\n');
        
        await this.testAuthManagerState();
        await this.testCookieSetup();
        await this.testAPIRequests();
        await this.testCSRFProtection();
        await this.testCookieSecurity();
        await this.testBackwardCompatibility();
        
        this.generateReport();
    }

    // 生成测试报告
    generateReport() {
        console.log('\n📊 测试报告');
        console.log('='.repeat(50));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const info = this.results.filter(r => r.status === 'INFO').length;
        
        console.log(`总测试数: ${this.results.length}`);
        console.log(`✅ 通过: ${passed}`);
        console.log(`❌ 失败: ${failed}`);
        console.log(`ℹ️  信息: ${info}`);
        
        if (failed === 0) {
            console.log('\n🎉 所有关键测试通过！第二阶段安全功能正常工作。');
        } else {
            console.log('\n⚠️  发现问题，请检查失败的测试项。');
        }
        
        // 详细结果
        console.log('\n详细结果:');
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : 'ℹ️';
            console.log(`${icon} ${result.test}: ${result.message}`);
        });
    }
}

// 运行测试
const tester = new SecurityPhase2Tester();
tester.runAllTests();
```

## 手动测试步骤

### 1. 登录测试

1. **清除所有数据**:
   ```javascript
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
       const eqPos = c.indexOf("=");
       const name = eqPos > -1 ? c.substr(0, eqPos) : c;
       document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
   });
   location.reload();
   ```

2. **执行登录**:
   - 输入正确密码
   - 观察是否出现密码输入界面
   - 验证登录成功

3. **检查Cookie设置**:
   ```javascript
   // 检查Cookie
   console.log('所有Cookie:', document.cookie);
   
   // 检查认证状态
   console.log('认证状态:', {
       isAuthenticated: window.authManager?.isAuthenticated,
       usesCookies: window.authManager?.usesCookies,
       hasCSRFToken: !!window.authManager?.csrfToken
   });
   ```

### 2. API功能测试

1. **查看历史记录**: 应该正常加载，无401错误
2. **保存新内容**: 应该能成功保存
3. **删除记录**: 应该能正常删除
4. **查看存储信息**: 应该显示正确信息

### 3. 安全功能测试

1. **CSRF保护测试**:
   ```javascript
   // 尝试不带CSRF token的请求
   fetch('/api/records', {
       method: 'POST',
       body: new FormData(),
       credentials: 'same-origin'
   }).then(r => console.log('无CSRF token请求结果:', r.status));
   ```

2. **HttpOnly Cookie测试**:
   ```javascript
   // 尝试访问HttpOnly Cookie
   const cookies = document.cookie;
   console.log('可访问的Cookie:', cookies);
   console.log('包含认证token:', cookies.includes('cc_auth_token'));
   ```

### 4. 注销测试

1. **执行注销**:
   ```javascript
   window.authManager.logout();
   ```

2. **验证清理**:
   - Cookie应该被清除
   - localStorage应该被清理
   - 页面应该重新加载并要求登录

## 性能测试

### 响应时间测试

```javascript
// 测试API响应时间
async function testPerformance() {
    const tests = [
        { name: 'GET /api/records', url: '/api/records', method: 'GET' },
        { name: 'GET /api/storage', url: '/api/storage', method: 'GET' }
    ];
    
    for (const test of tests) {
        const start = performance.now();
        const config = window.authManager.getRequestConfig({ method: test.method });
        
        try {
            const response = await fetch(test.url, config);
            const end = performance.now();
            const duration = end - start;
            
            console.log(`${test.name}: ${duration.toFixed(2)}ms (${response.status})`);
        } catch (error) {
            console.error(`${test.name}: 失败 - ${error.message}`);
        }
    }
}

testPerformance();
```

## 浏览器兼容性测试

### 支持的浏览器

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### 测试方法

在不同浏览器中执行以下检查：

```javascript
// 浏览器兼容性检查
function checkBrowserCompatibility() {
    const features = {
        'Fetch API': typeof fetch !== 'undefined',
        'Promise': typeof Promise !== 'undefined',
        'localStorage': typeof localStorage !== 'undefined',
        'Cookie支持': navigator.cookieEnabled,
        'HTTPS': location.protocol === 'https:'
    };
    
    console.log('浏览器兼容性检查:');
    Object.entries(features).forEach(([feature, supported]) => {
        console.log(`${supported ? '✅' : '❌'} ${feature}: ${supported}`);
    });
}

checkBrowserCompatibility();
```

## 故障排除

### 常见问题检查

```javascript
// 故障诊断脚本
function diagnoseIssues() {
    console.log('🔍 故障诊断开始...\n');
    
    // 1. 检查环境
    console.log('环境检查:');
    console.log('- HTTPS:', location.protocol === 'https:');
    console.log('- 域名:', location.hostname);
    console.log('- 路径:', location.pathname);
    
    // 2. 检查认证管理器
    console.log('\n认证管理器:');
    if (window.authManager) {
        console.log('- 存在: ✅');
        console.log('- 已认证:', window.authManager.isAuthenticated);
        console.log('- Cookie模式:', window.authManager.usesCookies);
        console.log('- CSRF Token:', !!window.authManager.csrfToken);
    } else {
        console.log('- 存在: ❌');
    }
    
    // 3. 检查Cookie
    console.log('\nCookie检查:');
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log('- 总数:', cookies.length);
    console.log('- 认证Cookie:', cookies.some(c => c.startsWith('cc_auth_token')));
    console.log('- CSRF Cookie:', cookies.some(c => c.startsWith('cc_csrf_token')));
    
    // 4. 检查localStorage
    console.log('\nlocalStorage检查:');
    const authData = localStorage.getItem('cloudclipboard_auth');
    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            console.log('- 类型:', parsed.type);
            console.log('- Cookie模式:', parsed.usesCookies);
            console.log('- 时间戳:', new Date(parsed.timestamp));
        } catch (e) {
            console.log('- 解析失败:', e.message);
        }
    } else {
        console.log('- 无认证数据');
    }
}

diagnoseIssues();
```

## 安全验证

### 安全检查清单

- [ ] HttpOnly Cookie正确设置
- [ ] CSRF token在请求头中发送
- [ ] 无CSRF token的POST请求被拒绝
- [ ] JavaScript无法访问认证Cookie
- [ ] 注销功能清除所有认证信息
- [ ] API响应时间在可接受范围内
- [ ] 向后兼容性正常工作

### 渗透测试

```javascript
// 简单的安全测试
async function securityTest() {
    console.log('🛡️ 安全测试开始...\n');
    
    // 测试1: 尝试伪造CSRF token
    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'X-CSRF-Token': 'fake-token'
            },
            body: new FormData(),
            credentials: 'same-origin'
        });
        console.log('伪造CSRF token测试:', response.status === 401 ? '✅ 被拒绝' : '❌ 被接受');
    } catch (e) {
        console.log('伪造CSRF token测试: ❌ 错误', e.message);
    }
    
    // 测试2: 尝试不发送Cookie
    try {
        const response = await fetch('/api/records', {
            method: 'GET',
            credentials: 'omit'
        });
        console.log('无Cookie请求测试:', response.status === 401 ? '✅ 被拒绝' : '❌ 被接受');
    } catch (e) {
        console.log('无Cookie请求测试: ❌ 错误', e.message);
    }
}

securityTest();
```

---

**注意**: 这些测试脚本仅用于开发和测试环境。在生产环境中，请使用专业的安全测试工具进行全面的安全评估。