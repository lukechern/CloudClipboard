// 认证问题排查工具
// 用于诊断和修复认证状态丢失问题

class AuthDebugger_7ree {
    constructor() {
        this.debugEnabled = true;
        this.logHistory = [];
        this.maxLogHistory = 100;
    }

    // 启用调试模式
    enableDebug() {
        this.debugEnabled = true;
        console.log('🔧 [AUTH-DEBUG] 认证调试模式已启用');
        this.startMonitoring();
    }

    // 禁用调试模式
    disableDebug() {
        this.debugEnabled = false;
        console.log('🔧 [AUTH-DEBUG] 认证调试模式已禁用');
    }

    // 记录调试信息
    log(level, message, data = null) {
        if (!this.debugEnabled) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data
        };

        this.logHistory.push(logEntry);
        if (this.logHistory.length > this.maxLogHistory) {
            this.logHistory.shift();
        }

        const emoji = {
            'info': 'ℹ️',
            'warn': '⚠️',
            'error': '❌',
            'success': '✅'
        }[level] || '🔧';

        console.log(`${emoji} [AUTH-DEBUG] ${message}`, data || '');
    }

    // 开始监控认证状态
    startMonitoring() {
        this.log('info', '开始监控认证状态');

        // 监控localStorage变化
        this.monitorLocalStorage();

        // 监控Cookie变化
        this.monitorCookies();

        // 监控网络请求
        this.monitorNetworkRequests();

        // 定期检查认证状态
        setInterval(() => {
            this.checkAuthStatus();
        }, 30000); // 每30秒检查一次
    }

    // 监控localStorage变化
    monitorLocalStorage() {
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;
        const originalClear = localStorage.clear;

        localStorage.setItem = (key, value) => {
            if (key.includes('cloudclipboard_auth')) {
                this.log('info', 'localStorage设置认证数据', { key, valueLength: value.length });
            }
            return originalSetItem.call(localStorage, key, value);
        };

        localStorage.removeItem = (key) => {
            if (key.includes('cloudclipboard_auth')) {
                this.log('warn', 'localStorage删除认证数据', { key });
            }
            return originalRemoveItem.call(localStorage, key);
        };

        localStorage.clear = () => {
            this.log('warn', 'localStorage被清空');
            return originalClear.call(localStorage);
        };
    }

    // 监控Cookie变化
    monitorCookies() {
        let lastCookies = document.cookie;
        
        setInterval(() => {
            const currentCookies = document.cookie;
            if (currentCookies !== lastCookies) {
                this.log('info', 'Cookie发生变化', {
                    before: lastCookies,
                    after: currentCookies
                });
                lastCookies = currentCookies;
            }
        }, 5000); // 每5秒检查一次
    }

    // 监控网络请求
    monitorNetworkRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            if (url.includes('/api/')) {
                this.log('info', '发起API请求', {
                    url: url,
                    method: options.method || 'GET',
                    headers: options.headers
                });
            }
            
            try {
                const response = await originalFetch(url, options);
                
                if (url.includes('/api/')) {
                    this.log(response.ok ? 'success' : 'error', 'API请求响应', {
                        url: url,
                        status: response.status,
                        statusText: response.statusText
                    });
                }
                
                return response;
            } catch (error) {
                if (url.includes('/api/')) {
                    this.log('error', 'API请求失败', {
                        url: url,
                        error: error.message
                    });
                }
                throw error;
            }
        };
    }

    // 检查当前认证状态
    checkAuthStatus() {
        const authManager = window.authManager;
        if (!authManager) {
            this.log('error', '认证管理器不存在');
            return;
        }

        const stored = localStorage.getItem(authManager.storageKey);
        const cookies = document.cookie;
        
        this.log('info', '认证状态检查', {
            isAuthenticated: authManager.isAuthenticated,
            hasAuthToken: !!authManager.authToken,
            hasCSRFToken: !!authManager.csrfToken,
            usesCookies: authManager.usesCookies,
            hasStoredData: !!stored,
            cookieCount: cookies.split(';').length,
            timestamp: new Date().toISOString()
        });
    }

    // 诊断认证问题
    async diagnoseAuthIssues() {
        this.log('info', '开始诊断认证问题');
        
        const issues = [];
        const authManager = window.authManager;
        
        if (!authManager) {
            issues.push('认证管理器不存在');
            return issues;
        }

        // 检查localStorage
        const stored = localStorage.getItem(authManager.storageKey);
        if (!stored && authManager.isAuthenticated) {
            issues.push('localStorage中缺少认证数据但状态显示已认证');
        }

        // 检查token有效性
        if (authManager.isAuthenticated) {
            try {
                const response = await fetch('/api/records', authManager.getRequestConfig({ method: 'GET' }));
                if (!response.ok) {
                    issues.push(`Token验证失败: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                issues.push(`Token验证异常: ${error.message}`);
            }
        }

        // 检查Cookie
        if (authManager.usesCookies) {
            const cookies = document.cookie;
            if (!cookies.includes('cc_auth_token')) {
                issues.push('Cookie模式但缺少认证Cookie');
            }
        }

        this.log(issues.length > 0 ? 'error' : 'success', '诊断完成', {
            issuesFound: issues.length,
            issues: issues
        });

        return issues;
    }

    // 尝试修复认证问题
    async repairAuthIssues() {
        this.log('info', '开始尝试修复认证问题');
        
        const authManager = window.authManager;
        if (!authManager) {
            this.log('error', '无法修复：认证管理器不存在');
            return false;
        }

        try {
            // 尝试重新验证
            const isValid = await authManager.validateStoredToken();
            if (!isValid) {
                this.log('warn', 'Token无效，清除认证状态');
                authManager.clearStoredAuth();
                authManager.showAuthModal();
                return true;
            }

            this.log('success', '认证状态修复成功');
            return true;
        } catch (error) {
            this.log('error', '修复失败', { error: error.message });
            return false;
        }
    }

    // 导出调试日志
    exportLogs() {
        const logData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            logs: this.logHistory
        };

        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auth-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.log('success', '调试日志已导出');
    }

    // 清除调试日志
    clearLogs() {
        this.logHistory = [];
        this.log('info', '调试日志已清除');
    }
}

// 创建全局调试器实例
window.authDebugger_7ree = new AuthDebugger_7ree();

// 在开发环境下自动启用调试
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    window.authDebugger_7ree.enableDebug();
}

// 添加控制台命令
window.authDebug = {
    enable: () => window.authDebugger_7ree.enableDebug(),
    disable: () => window.authDebugger_7ree.disableDebug(),
    check: () => window.authDebugger_7ree.checkAuthStatus(),
    diagnose: () => window.authDebugger_7ree.diagnoseAuthIssues(),
    repair: () => window.authDebugger_7ree.repairAuthIssues(),
    export: () => window.authDebugger_7ree.exportLogs(),
    clear: () => window.authDebugger_7ree.clearLogs()
};

console.log('🔧 认证调试工具已加载。使用 authDebug.enable() 启用调试模式。');