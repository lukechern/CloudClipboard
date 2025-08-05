# iframe环境中的剪贴板支持

## 问题说明

当CloudClipboard在iframe中运行时（如浏览器插件的侧边栏），由于浏览器的安全限制，无法直接访问系统剪贴板。主要限制包括：

1. **焦点限制**: iframe默认没有焦点，而剪贴板API需要文档处于焦点状态
2. **权限限制**: 某些浏览器对iframe中的剪贴板访问有额外限制
3. **用户激活**: 需要用户交互才能访问剪贴板

## 解决方案

### 1. 自动焦点获取
系统会自动尝试获取焦点并读取剪贴板：
- 页面加载时尝试获取焦点
- 用户交互时重新尝试
- 页面变为可见时尝试

### 2. 父窗口通信
支持通过postMessage与父窗口通信：

#### 发送请求
```javascript
window.parent.postMessage({
    type: 'REQUEST_CLIPBOARD',
    source: 'cloudclipboard'
}, '*');
```

#### 接收响应
```javascript
window.addEventListener('message', function(event) {
    if (event.data.type === 'CLIPBOARD_CONTENT' && event.data.source === 'cloudclipboard') {
        // 处理剪贴板内容
        const content = event.data.content;
    }
});
```

### 3. 手动读取按钮
当自动读取失败时，会显示手动读取按钮：
- 用户点击按钮主动触发剪贴板读取
- 提供清晰的用户指引
- 支持加载状态和错误处理

## 浏览器插件集成

### 父窗口脚本示例

如果您的浏览器插件需要支持剪贴板功能，可以在父窗口中添加以下代码：

```javascript
// 监听来自iframe的剪贴板请求
window.addEventListener('message', async function(event) {
    if (event.data && event.data.type === 'REQUEST_CLIPBOARD' && event.data.source === 'cloudclipboard') {
        try {
            // 读取剪贴板内容
            const clipboardText = await navigator.clipboard.readText();
            
            // 发送剪贴板内容到iframe
            event.source.postMessage({
                type: 'CLIPBOARD_CONTENT',
                source: 'cloudclipboard',
                content: clipboardText
            }, event.origin);
            
        } catch (err) {
            console.error('父窗口读取剪贴板失败:', err);
            
            // 发送错误信息
            event.source.postMessage({
                type: 'CLIPBOARD_ERROR',
                source: 'cloudclipboard',
                error: err.message
            }, event.origin);
        }
    }
});
```

### Chrome扩展manifest.json配置

```json
{
    "permissions": [
        "clipboardRead",
        "activeTab"
    ],
    "content_security_policy": {
        "extension_pages": "script-src 'self'; object-src 'self'"
    }
}
```

## 用户体验

### 自动模式
- ✅ 页面加载时自动尝试读取剪贴板
- ✅ 用户交互时重新尝试
- ✅ 成功时显示提示信息

### 手动模式
- 📋 显示"读取剪贴板内容"按钮
- 💡 提供友好的提示信息
- ⏳ 点击时显示加载状态
- ✅ 成功后自动隐藏按钮

### 错误处理
- 🚫 剪贴板为空时的提示
- ❌ 读取失败时的错误信息
- 🔄 提供手动粘贴的替代方案

## 测试方法

### 1. 本地测试
```html
<!DOCTYPE html>
<html>
<head>
    <title>iframe测试</title>
</head>
<body>
    <h1>父窗口</h1>
    <iframe src="https://your-domain.pages.dev" width="400" height="600"></iframe>
    
    <script>
        // 添加父窗口剪贴板支持脚本
    </script>
</body>
</html>
```

### 2. 浏览器插件测试
1. 创建简单的浏览器插件
2. 在侧边栏中加载CloudClipboard
3. 测试剪贴板读取功能

### 3. 功能验证
- [ ] 自动读取剪贴板内容
- [ ] 手动按钮正常工作
- [ ] 父窗口通信正常
- [ ] 错误处理正确
- [ ] 用户体验良好

## 故障排除

### 常见问题

1. **按钮不显示**
   - 检查是否在iframe环境中
   - 确认自动读取是否失败

2. **读取失败**
   - 检查浏览器权限设置
   - 确认HTTPS环境
   - 验证用户交互

3. **父窗口通信失败**
   - 检查postMessage监听器
   - 验证消息格式
   - 确认跨域设置

### 调试信息

打开浏览器控制台查看详细日志：
- `检测到iframe环境，尝试获取焦点...`
- `已向父窗口请求剪贴板内容`
- `已通过父窗口获取剪贴板内容`
- `无法读取剪贴板: Document is not focused`

## 最佳实践

1. **渐进增强**: 优先尝试自动读取，失败时提供手动选项
2. **用户指引**: 提供清晰的操作提示和错误信息
3. **性能优化**: 避免频繁的剪贴板访问尝试
4. **隐私保护**: 只在必要时读取剪贴板内容
5. **兼容性**: 支持多种浏览器和环境