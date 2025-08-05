// 认证管理类
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.storageKey = 'cloudclipboard_auth';
        this.init();
    }

    // 初始化认证管理器
    async init() {
        // 检查本地存储的认证信息
        this.loadStoredAuth();
        
        // 检查服务器是否需要密码保护
        const needsAuth = await this.checkAuthRequired();
        
        if (needsAuth && !this.isAuthenticated) {
            this.showAuthModal();
        } else if (!needsAuth) {
            this.isAuthenticated = true;
            this.onAuthSuccess();
        } else {
            // 验证存储的token是否仍然有效
            const isValid = await this.validateStoredToken();
            if (isValid) {
                this.onAuthSuccess();
            } else {
                this.clearStoredAuth();
                this.showAuthModal();
            }
        }
    }

    // 检查服务器是否需要密码保护
    async checkAuthRequired() {
        try {
            const response = await fetch('/api/auth');
            const data = await response.json();
            return data.needs_password;
        } catch (error) {
            console.error('检查认证要求失败:', error);
            return false;
        }
    }

    // 验证存储的token
    async validateStoredToken() {
        if (!this.authToken) return false;
        
        try {
            const response = await fetch('/api/records', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 从本地存储加载认证信息
    loadStoredAuth() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const authData = JSON.parse(stored);
                // 检查是否过期（7天）
                const now = Date.now();
                const expiry = authData.timestamp + (7 * 24 * 60 * 60 * 1000);
                
                if (now < expiry) {
                    this.authToken = authData.token;
                    this.isAuthenticated = true;
                } else {
                    this.clearStoredAuth();
                }
            }
        } catch (error) {
            console.error('加载存储的认证信息失败:', error);
            this.clearStoredAuth();
        }
    }

    // 保存认证信息到本地存储
    saveAuth(password) {
        try {
            const token = btoa(password);
            const authData = {
                token: token,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(authData));
            this.authToken = token;
            this.isAuthenticated = true;
        } catch (error) {
            console.error('保存认证信息失败:', error);
        }
    }

    // 清除存储的认证信息
    clearStoredAuth() {
        localStorage.removeItem(this.storageKey);
        this.authToken = null;
        this.isAuthenticated = false;
    }

    // 显示认证模态框
    showAuthModal() {
        // 锁定主内容
        document.body.classList.add('content-locked');
        
        // 创建认证界面
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.id = 'authOverlay';
        
        overlay.innerHTML = `
            <div class="auth-modal">
                <div class="auth-header">
                    <h2>🔐 访问验证</h2>
                    <p>请输入访问密码以继续使用云剪贴板</p>
                </div>
                
                <form class="auth-form" id="authForm">
                    <input 
                        type="password" 
                        class="auth-input" 
                        id="passwordInput" 
                        placeholder="请输入访问密码"
                        required
                        autocomplete="current-password"
                    >
                    
                    <div class="auth-remember">
                        <input type="checkbox" id="rememberAuth" checked>
                        <label for="rememberAuth">记住密码（7天内免输入）</label>
                    </div>
                    
                    <button type="submit" class="auth-button" id="authSubmit">
                        验证访问权限
                    </button>
                    
                    <div class="auth-error" id="authError"></div>
                    
                    <div class="auth-loading" id="authLoading">
                        <img src="img/spinner.svg" alt="Loading">
                        正在验证...
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 显示模态框
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        // 绑定事件
        this.bindAuthEvents();
        
        // 聚焦到密码输入框
        document.getElementById('passwordInput').focus();
    }

    // 绑定认证相关事件
    bindAuthEvents() {
        const form = document.getElementById('authForm');
        const passwordInput = document.getElementById('passwordInput');
        const submitBtn = document.getElementById('authSubmit');
        const errorDiv = document.getElementById('authError');
        const loadingDiv = document.getElementById('authLoading');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = passwordInput.value.trim();
            if (!password) {
                this.showAuthError('请输入密码');
                return;
            }

            // 显示加载状态
            submitBtn.disabled = true;
            loadingDiv.classList.add('show');
            errorDiv.classList.remove('show');

            try {
                const success = await this.verifyPassword(password);
                
                if (success) {
                    // 检查是否需要记住密码
                    const rememberAuth = document.getElementById('rememberAuth').checked;
                    if (rememberAuth) {
                        this.saveAuth(password);
                    }
                    
                    this.hideAuthModal();
                    this.onAuthSuccess();
                } else {
                    this.showAuthError('密码错误，请重试');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                this.showAuthError('验证失败: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                loadingDiv.classList.remove('show');
            }
        });

        // 回车键提交
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                form.dispatchEvent(new Event('submit'));
            }
        });
    }

    // 验证密码
    async verifyPassword(password) {
        const formData = new FormData();
        formData.append('password', password);

        const response = await fetch('/api/auth', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        return data.success;
    }

    // 显示认证错误
    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        const passwordInput = document.getElementById('passwordInput');
        
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        passwordInput.classList.add('error');
        
        // 3秒后清除错误样式
        setTimeout(() => {
            passwordInput.classList.remove('error');
        }, 3000);
    }

    // 隐藏认证模态框
    hideAuthModal() {
        const overlay = document.getElementById('authOverlay');
        
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
                document.body.classList.remove('content-locked');
            }, 300);
        }
    }

    // 认证成功回调
    onAuthSuccess() {
        this.isAuthenticated = true;
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('authSuccess'));
        
        // 如果页面已经加载完成，重新初始化应用
        if (document.readyState === 'complete') {
            this.initializeApp();
        }
    }

    // 初始化应用
    initializeApp() {
        // 重新加载记录和存储信息
        if (typeof loadRecords === 'function') {
            loadRecords();
        }
        if (typeof loadStorageInfo === 'function') {
            loadStorageInfo();
        }
    }

    // 获取认证头
    getAuthHeaders() {
        if (this.authToken) {
            return {
                'Authorization': `Bearer ${this.authToken}`
            };
        }
        return {};
    }

    // 注销
    logout() {
        this.clearStoredAuth();
        location.reload();
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();