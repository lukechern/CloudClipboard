// 认证调试工具
// 在浏览器控制台中使用

window.debugAuth = {
    // 检查认证状态
    checkAuthState() {
        console.log('🔍 认证状态检查:');
        console.log('认证管理器存在:', !!window.authManager);
        
        if (window.authManager) {
            console.log('已认证:', window.authManager.isAuthenticated);
            console.log('使用Cookie:', window.authManager.usesCookies);
            console.log('有JWT Token:', !!window.authManager.authToken);
            console.log('有CSRF Token:', !!window.authManager.csrfToken);
            
            if (window.authManager.csrfToken) {
                console.log('CSRF Token预览:', window.authManager.csrfToken.substring(0, 20) + '...');
            }
            
            console.log('认证头:', window.authManager.getAuthHeaders());
        }
        
        // 检查localStorage
        const stored = localStorage.getItem('cloudclipboard_auth');
        if (stored) {
            try {
                const authData = JSON.parse(stored);
                console.log('localStorage数据:', {
                    type: authData.type,
                    usesCookies: authData.usesCookies,
                    hasCSRFToken: !!authData.csrfToken,
                    timestamp: new Date(authData.timestamp)
                });
            } catch (e) {
                console.error('localStorage数据解析失败:', e);
            }
        } else {
            console.log('localStorage中无认证数据');
        }
        
        // 检查Cookie
        const cookies = document.cookie.split(';').map(c => c.trim());
        const authCookie = cookies.find(c => c.startsWith('cc_auth_token='));
        const csrfCookie = cookies.find(c => c.startsWith('cc_csrf_token='));
        
        console.log('Cookie状态:', {
            hasAuthCookie: !!authCookie,
            hasCSRFCookie: !!csrfCookie,
            totalCookies: cookies.length
        });
    },
    
    // 测试单个删除请求
    async testDelete(recordId) {
        console.log('🗑️ 测试删除记录:', recordId);
        
        if (!window.authManager) {
            console.error('认证管理器不存在');
            return;
        }
        
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
    },
    
    // 重新获取CSRF token
    async refreshAuth() {
        console.log('🔄 尝试刷新认证...');
        
        if (window.authManager) {
            // 清除当前认证状态
            window.authManager.clearStoredAuth();
            
            // 重新初始化
            await window.authManager.init();
        }
    },
    
    // 清除所有认证信息
    clearAll() {
        console.log('🧹 清除所有认证信息...');
        
        // 清除localStorage
        localStorage.removeItem('cloudclipboard_auth');
        
        // 清除Cookie
        document.cookie.split(";").forEach(c => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
            if (name.startsWith('cc_')) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
        });
        
        // 重置认证管理器
        if (window.authManager) {
            window.authManager.isAuthenticated = false;
            window.authManager.authToken = null;
            window.authManager.csrfToken = null;
            window.authManager.usesCookies = false;
        }
        
        console.log('认证信息已清除，请刷新页面');
    }
};

// 自动检查认证状态
console.log('🚀 认证调试工具已加载');
console.log('使用 debugAuth.checkAuthState() 检查认证状态');
console.log('使用 debugAuth.testDelete(recordId) 测试删除功能');
console.log('使用 debugAuth.refreshAuth() 刷新认证');
console.log('使用 debugAuth.clearAll() 清除所有认证信息');