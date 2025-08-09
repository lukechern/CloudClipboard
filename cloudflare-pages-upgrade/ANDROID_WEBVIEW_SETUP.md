# Android WebView 配置指南

为了确保云剪贴板在Android WebView中能够正确保存登录状态，需要在Android应用中进行以下配置：

## 1. WebView基础配置

```kotlin
// 在Activity或Fragment中配置WebView
private fun setupWebView() {
    webView.settings.apply {
        // 启用JavaScript
        javaScriptEnabled = true
        
        // 启用DOM存储
        domStorageEnabled = true
        
        // 启用数据库存储
        databaseEnabled = true
        
        // 启用应用缓存
        setAppCacheEnabled(true)
        setAppCachePath(applicationContext.cacheDir.absolutePath)
        
        // 设置缓存模式
        cacheMode = WebSettings.LOAD_DEFAULT
        
        // 允许文件访问
        allowFileAccess = true
        allowContentAccess = true
        
        // 设置User Agent（可选，用于识别）
        userAgentString = "$userAgentString CloudClipboardApp/1.0"
    }
    
    // 设置WebView客户端
    webView.webViewClient = object : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebViewResourceRequest?): Boolean {
            return false
        }
    }
    
    // 启用调试模式（开发时使用）
    if (BuildConfig.DEBUG) {
        WebView.setWebContentsDebuggingEnabled(true)
    }
}
```

## 2. 添加JavaScript接口（可选但推荐）

```kotlin
// 创建JavaScript接口类
class WebAppInterface(private val context: Context) {
    private val sharedPrefs = context.getSharedPreferences("CloudClipboardAuth", Context.MODE_PRIVATE)
    
    @JavascriptInterface
    fun saveAuthData(authDataJson: String) {
        try {
            // 保存认证数据到SharedPreferences
            sharedPrefs.edit()
                .putString("auth_data", authDataJson)
                .putLong("save_time", System.currentTimeMillis())
                .apply()
            
            Log.d("WebAppInterface", "认证数据已保存")
        } catch (e: Exception) {
            Log.e("WebAppInterface", "保存认证数据失败", e)
        }
    }
    
    @JavascriptInterface
    fun getAuthData(): String? {
        return try {
            val authData = sharedPrefs.getString("auth_data", null)
            val saveTime = sharedPrefs.getLong("save_time", 0)
            
            // 检查是否过期（7天）
            val now = System.currentTimeMillis()
            val expiry = saveTime + (7 * 24 * 60 * 60 * 1000)
            
            if (now < expiry && authData != null) {
                Log.d("WebAppInterface", "返回保存的认证数据")
                authData
            } else {
                Log.d("WebAppInterface", "认证数据已过期或不存在")
                clearAuthData()
                null
            }
        } catch (e: Exception) {
            Log.e("WebAppInterface", "获取认证数据失败", e)
            null
        }
    }
    
    @JavascriptInterface
    fun clearAuthData() {
        sharedPrefs.edit().clear().apply()
        Log.d("WebAppInterface", "认证数据已清除")
    }
}

// 在setupWebView中添加接口
private fun setupWebView() {
    // ... 其他配置 ...
    
    // 添加JavaScript接口
    webView.addJavascriptInterface(WebAppInterface(this), "AndroidInterface")
}
```

## 3. 页面加载完成后恢复认证状态

```kotlin
webView.webViewClient = object : WebViewClient() {
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        
        // 页面加载完成后，尝试恢复认证状态
        restoreAuthState()
    }
}

private fun restoreAuthState() {
    val interface = WebAppInterface(this)
    val authData = interface.getAuthData()
    
    if (authData != null) {
        // 通过JavaScript恢复认证状态
        val script = """
            if (window.authManager && window.authManager.restoreAuthFromNative) {
                try {
                    const authData = $authData;
                    window.authManager.restoreAuthFromNative(authData);
                    console.log('从原生应用恢复认证状态成功');
                } catch (e) {
                    console.error('恢复认证状态失败:', e);
                }
            }
        """.trimIndent()
        
        webView.evaluateJavascript(script) { result ->
            Log.d("WebView", "认证状态恢复结果: $result")
        }
    }
}
```

## 4. 应用生命周期管理

```kotlin
override fun onPause() {
    super.onPause()
    // 暂停WebView
    webView.onPause()
}

override fun onResume() {
    super.onResume()
    // 恢复WebView
    webView.onResume()
    
    // 检查并恢复认证状态
    webView.post {
        restoreAuthState()
    }
}

override fun onDestroy() {
    super.onDestroy()
    // 清理WebView
    webView.destroy()
}
```

## 5. 权限配置

在 `AndroidManifest.xml` 中添加必要权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 6. 测试和调试

1. **启用WebView调试**：在开发版本中启用 `WebView.setWebContentsDebuggingEnabled(true)`
2. **使用Chrome DevTools**：连接设备后在Chrome中访问 `chrome://inspect` 调试WebView
3. **查看日志**：使用 `adb logcat` 查看相关日志
4. **测试流程**：
   - 打开应用并登录
   - 完全关闭应用
   - 重新打开应用
   - 检查是否保持登录状态

## 7. 常见问题解决

### 问题1：localStorage数据丢失
**解决方案**：确保启用了 `domStorageEnabled = true`

### 问题2：应用重启后认证状态丢失
**解决方案**：使用JavaScript接口将认证数据保存到SharedPreferences

### 问题3：Cookie不工作
**解决方案**：WebView环境下已自动切换到localStorage模式，无需担心Cookie问题

### 问题4：网络请求失败
**解决方案**：检查网络权限和HTTPS证书配置

通过以上配置，Android WebView应该能够正确保存和恢复云剪贴板的登录状态。