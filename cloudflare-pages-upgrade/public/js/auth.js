// 认证管理类
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.csrfToken = null;
        this.usesCookies = false;
        this.storageKey = 'cloudclipboard_auth';
        this.isWebView = false;
        this.webViewType = null;
        this.init();
    }

    // 检测WebView环境并进行兼容性处理
    detectAndHandleWebView() {
        const userAgent = navigator.userAgent;
        
        // 检测各种WebView环境
        this.isWebView = /wv|WebView|Android.*Version\/\d+\.\d+.*Chrome/i.test(userAgent);
        
        if (this.isWebView) {
            console.log('检测到WebView环境:', userAgent);
            
            // 检测具体的WebView类型
            if (/Android/i.test(userAgent)) {
                this.webViewType = 'android';
                console.log('Android WebView检测到');
                
                // Android WebView特殊处理
                this.handleAndroidWebView();
            }
        }
    }

    // Android WebView特殊处理
    handleAndroidWebView() {
        console.log('应用Android WebView兼容性修复');
        
        // 1. 强制使用localStorage而不是Cookie
        this.usesCookies = false;
        console.log('WebView模式：强制使用localStorage存储');
        
        // 2. 增加存储检查频率
        this.setupWebViewStorageMonitoring();
        
        // 3. 尝试通过postMessage与原生应用通信（如果支持）
        this.setupNativeAppCommunication();
    }

    // 设置WebView存储监控
    setupWebViewStorageMonitoring() {
        // 用于防抖的变量
        this.lastFocusCheckTime = 0;
        
        // 每30秒检查一次存储状态
        setInterval(() => {
            if (this.isAuthenticated) {
                this.verifyAndRepairStorage();
            }
        }, 30000);
        
        // 页面可见性变化时检查存储
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated) {
                setTimeout(() => {
                    this.verifyAndRepairStorage();
                }, 1000);
            }
        });
        
        // 修复: 添加页面焦点恢复时的认证检查（带防抖）
        window.addEventListener('focus', () => {
            if (this.isAuthenticated) {
                const now = Date.now();
                // 防抖：5分钟内不重复检查
                if (now - this.lastFocusCheckTime > 5 * 60 * 1000) {
                    this.lastFocusCheckTime = now;
                    setTimeout(() => {
                        this.checkAuthStatus_7ree();
                    }, 1000);
                }
            }
        });
        
        // 修复: 添加页面加载完成后的认证检查
        window.addEventListener('load', () => {
            if (this.isAuthenticated) {
                setTimeout(() => {
                    this.checkAuthStatus_7ree();
                }, 2000);
            }
        });
    }

    // 验证并修复存储
    async verifyAndRepairStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored && this.isAuthenticated) {
                console.log('检测到存储丢失，尝试修复');
                // 重新保存当前认证状态
                this.saveAuth(this.authToken, this.csrfToken, this.usesCookies);
            }
        } catch (error) {
            console.error('存储验证失败:', error);
        }
    }

    // 设置与原生应用的通信
    setupNativeAppCommunication() {
        // 检查是否有原生应用提供的接口
        if (window.AndroidInterface || window.webkit?.messageHandlers) {
            console.log('检测到原生应用接口');
            
            // 监听来自原生应用的消息
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'restoreAuth') {
                    console.log('从原生应用恢复认证状态');
                    this.restoreAuthFromNative(event.data.authData);
                }
            });
        }
    }

    // 从原生应用恢复认证状态
    restoreAuthFromNative(authData) {
        if (authData && authData.token && authData.csrfToken) {
            this.authToken = authData.token;
            this.csrfToken = authData.csrfToken;
            this.usesCookies = false; // WebView模式强制使用localStorage
            this.isAuthenticated = true;
            
            // 保存到localStorage
            this.saveAuth(this.authToken, this.csrfToken, this.usesCookies);
            
            console.log('从原生应用恢复认证状态成功');
            this.onAuthSuccess();
        }
    }

    // 初始化认证管理器
    async init() {
        console.log('认证管理器初始化开始');
        
        // 检测WebView环境并进行兼容性处理
        this.detectAndHandleWebView();
        
        // 检查本地存储的认证信息
        this.loadStoredAuth();

        // 检查服务器是否需要密码保护
        const needsAuth = await this.checkAuthRequired();
        console.log('服务器需要认证:', needsAuth, '当前认证状态:', this.isAuthenticated);

        if (needsAuth && !this.isAuthenticated) {
            console.log('需要认证但未认证，显示登录界面');
            this.showAuthModal();
        } else if (!needsAuth) {
            console.log('服务器不需要认证，直接成功');
            this.isAuthenticated = true;
            this.onAuthSuccess();
        } else {
            console.log('已有认证信息，验证token有效性');
            // 验证存储的token是否仍然有效
            const isValid = await this.validateStoredToken();
            if (isValid) {
                console.log('Token验证成功，认证完成');
                this.onAuthSuccess();
            } else {
                console.log('Token验证失败，清除认证信息并重新登录');
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
        try {
            console.log('🔍 [DEBUG] 验证存储的token，认证状态:', {
                isAuthenticated: this.isAuthenticated,
                hasAuthToken: !!this.authToken,
                hasCSRFToken: !!this.csrfToken,
                usesCookies: this.usesCookies,
                timestamp: new Date().toISOString()
            });
            
            // 使用getRequestConfig确保正确的请求配置
            const config = this.getRequestConfig({ method: 'GET' });
            console.log('🔍 [DEBUG] 请求配置:', {
                headers: config.headers,
                credentials: config.credentials
            });
            
            const response = await fetch('/api/records', config);
            
            console.log('🔍 [DEBUG] Token验证响应:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 [DEBUG] Token验证失败响应内容:', errorText);
            }
            
            return response.ok;
        } catch (error) {
            console.error('🔍 [DEBUG] Token验证异常:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }
    
    // 带重试机制的token验证
    async validateStoredTokenWithRetry(maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Token验证尝试 ${attempt}/${maxRetries}`);
                
                const config = this.getRequestConfig({ method: 'GET' });
                const response = await Promise.race([
                    fetch('/api/records', config),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('请求超时')), 10000)
                    )
                ]);
                
                console.log(`Token验证尝试 ${attempt} 响应:`, {
                    status: response.status,
                    ok: response.ok
                });
                
                if (response.ok) {
                    return true;
                }
                
                // 401错误表示认证失败，不需要重试
                if (response.status === 401) {
                    console.log('收到401响应，认证确实无效');
                    return false;
                }
                
                // 其他错误可能是临时性的，继续重试
                if (attempt < maxRetries) {
                    console.log(`尝试 ${attempt} 失败（状态码: ${response.status}），等待重试...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // 递增延迟
                    continue;
                }
                
                return false;
                
            } catch (error) {
                console.error(`Token验证尝试 ${attempt} 异常:`, error.message);
                
                if (attempt < maxRetries) {
                    console.log(`尝试 ${attempt} 异常，等待重试...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // 递增延迟
                    continue;
                }
                
                // 所有尝试都失败，但这可能是网络问题，不应该清除认证
                console.log('所有Token验证尝试都失败，可能是网络问题');
                return false;
            }
        }
        
        return false;
    }

    // 从本地存储加载认证信息
    loadStoredAuth() {
        try {
            let stored = localStorage.getItem(this.storageKey);
            let authData = null;

            // 尝试从主存储位置加载
            if (stored) {
                authData = JSON.parse(stored);
            }
            
            // WebView环境下，如果主存储失败，尝试从备用位置恢复
            if (!authData && this.isWebView) {
                console.log('主存储为空，尝试从WebView备用存储恢复');
                authData = this.loadFromWebViewBackup();
            }

            if (authData) {
                // 检查是否过期（7天）
                const now = Date.now();
                const expiry = authData.timestamp + (7 * 24 * 60 * 60 * 1000);

                if (now < expiry) {
                    console.log('从localStorage加载认证信息:', {
                        type: authData.type,
                        usesCookies: authData.usesCookies,
                        hasToken: !!authData.token,
                        hasCSRFToken: !!authData.csrfToken,
                        age: Math.floor((now - authData.timestamp) / 60000) + ' 分钟',
                        webViewType: authData.webViewType
                    });
                    
                    // WebView环境强制使用localStorage模式
                    if (this.isWebView || authData.type === 'jwt-webview') {
                        this.authToken = authData.token;
                        this.csrfToken = authData.csrfToken;
                        this.usesCookies = false; // WebView强制不使用Cookie
                        this.isAuthenticated = true;
                        console.log('WebView模式认证信息已加载');
                    } else if (authData.usesCookies) {
                        // Cookie模式：只从localStorage获取CSRF token
                        this.csrfToken = authData.csrfToken;
                        this.usesCookies = true;
                        this.isAuthenticated = true;
                        console.log('Cookie模式认证信息已加载');
                    } else {
                        // 传统模式：从localStorage获取完整信息
                        this.authToken = authData.token;
                        this.csrfToken = authData.csrfToken;
                        this.usesCookies = false;
                        this.isAuthenticated = true;
                        console.log('传统模式认证信息已加载');
                    }
                } else {
                    console.log('存储的认证信息已过期，清除');
                    this.clearStoredAuth();
                }
            } else {
                console.log('未找到存储的认证信息');
            }
        } catch (error) {
            console.error('加载存储的认证信息失败:', error);
            this.clearStoredAuth();
        }
    }

    // 从WebView备用存储加载
    loadFromWebViewBackup() {
        try {
            // 1. 尝试从备用localStorage key加载
            let backup = localStorage.getItem(this.storageKey + '_webview');
            if (backup) {
                console.log('从WebView备用localStorage恢复');
                return JSON.parse(backup);
            }
            
            // 2. 尝试从sessionStorage加载
            backup = sessionStorage.getItem(this.storageKey + '_backup');
            if (backup) {
                console.log('从sessionStorage备份恢复');
                const authData = JSON.parse(backup);
                // 恢复到主存储位置
                localStorage.setItem(this.storageKey, backup);
                return authData;
            }
            
            return null;
        } catch (error) {
            console.error('从WebView备用存储加载失败:', error);
            return null;
        }
    }

    // 保存认证信息到本地存储
    saveAuth(token, csrfToken = null, usesCookies = false) {
        try {
            console.log('🔍 [DEBUG] 开始保存认证信息:', {
                hasToken: !!token,
                hasCSRFToken: !!csrfToken,
                usesCookies: usesCookies,
                isWebView: this.isWebView,
                timestamp: new Date().toISOString()
            });
            
            // 在WebView中强制使用localStorage模式
            if (this.isWebView) {
                usesCookies = false;
                console.log('🔍 [DEBUG] WebView环境：强制使用localStorage模式');
            }

            const authData = {
                token: token,
                csrfToken: csrfToken,
                usesCookies: usesCookies,
                timestamp: Date.now(),
                type: this.isWebView ? 'jwt-webview' : 'jwt',
                webViewType: this.webViewType
            };

            // 如果使用Cookie模式且不在WebView中，只保存CSRF token到localStorage
            if (usesCookies && !this.isWebView) {
                const cookieAuthData = {
                    csrfToken: csrfToken,
                    usesCookies: true,
                    timestamp: Date.now(),
                    type: 'jwt-cookie'
                };
                localStorage.setItem(this.storageKey, JSON.stringify(cookieAuthData));
                console.log('🔍 [DEBUG] Cookie模式：仅保存CSRF token到localStorage');
            } else {
                // 传统模式或WebView模式，保存完整信息
                localStorage.setItem(this.storageKey, JSON.stringify(authData));
                console.log('🔍 [DEBUG] 完整模式：保存所有认证信息到localStorage');
                
                // WebView中额外保存到多个位置以提高可靠性
                if (this.isWebView) {
                    this.saveAuthToMultipleLocations(authData);
                }
            }

            this.authToken = token;
            this.csrfToken = csrfToken;
            this.usesCookies = usesCookies;
            this.isAuthenticated = true;
            
            console.log('🔍 [DEBUG] 认证信息保存完成:', {
                isAuthenticated: this.isAuthenticated,
                usesCookies: this.usesCookies
            });
            
            // 通知原生应用保存认证状态
            this.notifyNativeAppAuthSaved(authData);
            
        } catch (error) {
            console.error('🔍 [DEBUG] 保存认证信息失败:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 在WebView中保存到多个位置
    saveAuthToMultipleLocations(authData) {
        try {
            // 1. 保存到sessionStorage作为备份
            sessionStorage.setItem(this.storageKey + '_backup', JSON.stringify(authData));
            
            // 2. 保存到一个备用key
            localStorage.setItem(this.storageKey + '_webview', JSON.stringify(authData));
            
            console.log('WebView多重存储保存完成');
        } catch (error) {
            console.error('WebView多重存储失败:', error);
        }
    }

    // 通知原生应用保存认证状态
    notifyNativeAppAuthSaved(authData) {
        try {
            // Android WebView接口
            if (window.AndroidInterface && window.AndroidInterface.saveAuthData) {
                window.AndroidInterface.saveAuthData(JSON.stringify(authData));
                console.log('已通知Android应用保存认证数据');
            }
        } catch (error) {
            console.error('通知原生应用失败:', error);
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

        // 监听密码输入，实时验证长度
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value.trim();
            if (password.length > 0 && password.length < 8) {
                submitBtn.disabled = true;
                submitBtn.textContent = '密码至少需要8位字符';
                submitBtn.classList.add('disabled');
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = '验证访问权限';
                submitBtn.classList.remove('disabled');
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = passwordInput.value.trim();
            if (!password) {
                this.showAuthError('请输入密码');
                return;
            }

            // 验证密码长度
            if (password.length < 8) {
                this.showAuthError('密码至少需要8位字符');
                return;
            }

            // 显示加载状态
            submitBtn.disabled = true;
            loadingDiv.classList.add('show');
            errorDiv.classList.remove('show');

            try {
                const result = await this.verifyPassword(password);

                if (result.success) {
                    console.log('认证成功，设置token信息:', {
                        hasToken: !!result.token,
                        hasCSRFToken: !!result.csrfToken,
                        usesCookies: result.usesCookies
                    });

                    // 设置token到实例变量
                    if (result.token) {
                        this.authToken = result.token;
                    }
                    if (result.csrfToken) {
                        this.csrfToken = result.csrfToken;
                        console.log('CSRF token已设置:', this.csrfToken.substring(0, 20) + '...');
                    }
                    if (result.usesCookies) {
                        this.usesCookies = true;
                    }
                    this.isAuthenticated = true;

                    // 检查是否需要记住密码
                    const rememberAuth = document.getElementById('rememberAuth').checked;
                    if (rememberAuth) {
                        this.saveAuth(result.token, result.csrfToken, result.usesCookies);
                    } else if (result.usesCookies && result.csrfToken) {
                        // 在Cookie模式下，即使不记住密码，也要保存CSRF token
                        // 因为CSRF token不能存储在HttpOnly Cookie中
                        this.saveAuth(null, result.csrfToken, result.usesCookies);
                    }

                    this.hideAuthModal();
                    this.onAuthSuccess();
                } else if (result.blocked) {
                    // 处理速率限制
                    const minutes = Math.ceil(result.remainingTime / 60);
                    this.showAuthError(`访问被暂时限制，请在 ${minutes} 分钟后重试`);
                    submitBtn.disabled = true;

                    // 倒计时显示
                    this.startBlockCountdown(result.remainingTime, submitBtn);
                } else {
                    // 显示剩余尝试次数
                    let errorMsg = result.error || '密码错误，请重试';
                    if (result.remaining !== undefined && result.remaining >= 0) {
                        errorMsg += ` (剩余尝试次数: ${result.remaining})`;
                    }
                    this.showAuthError(errorMsg);
                    passwordInput.value = '';
                    passwordInput.focus();

                    // 重置提交按钮状态，允许继续提交
                    submitBtn.disabled = false;
                    submitBtn.textContent = '验证访问权限';
                    submitBtn.classList.remove('disabled');
                }
            } catch (error) {
                this.showAuthError('验证失败: ' + error.message);
                // 重置提交按钮状态
                submitBtn.disabled = false;
                submitBtn.textContent = '验证访问权限';
                submitBtn.classList.remove('disabled');
            } finally {
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
            body: formData,
            credentials: 'same-origin' // 确保发送Cookie
        });

        const data = await response.json();

        // 如果验证成功，保存相关信息
        if (data.success) {
            if (data.token) {
                this.authToken = data.token;
            }
            if (data.csrfToken) {
                this.csrfToken = data.csrfToken;
            }
            if (data.usesCookies) {
                this.usesCookies = true;
            }
        }

        return {
            success: data.success,
            token: data.token,
            csrfToken: data.csrfToken,
            usesCookies: data.usesCookies,
            error: data.error,
            blocked: data.blocked,
            remainingTime: data.remainingTime,
            remaining: data.remaining
        };
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

        // 如果页面已经加载完成，初始化应用
        if (document.readyState === 'complete') {
            this.initializeApp();
        }
    }

    // 初始化应用
    initializeApp() {
        // console.log('initializeApp() 被调用，initialDataLoaded:', window.initialDataLoaded);
        // 只有在初始数据未加载时才加载
        if (!window.initialDataLoaded) {
            console.log('认证管理器初始化应用数据');
            if (typeof loadRecords === 'function') {
                loadRecords();
            }
            if (typeof loadStorageInfo === 'function') {
                loadStorageInfo();
            }
            window.initialDataLoaded = true;
        } else {
            // 如果数据已加载，但需要更新存储信息显示状态
            if (typeof loadStorageInfo === 'function') {
                loadStorageInfo();
            }
        }
    }

    // 开始封锁倒计时
    startBlockCountdown(remainingSeconds, submitBtn) {
        let remaining = remainingSeconds;

        const updateButton = () => {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            submitBtn.textContent = `请等待 ${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        updateButton();

        const countdown = setInterval(() => {
            remaining--;

            if (remaining <= 0) {
                clearInterval(countdown);
                submitBtn.disabled = false;
                submitBtn.textContent = '验证访问权限';

                // 清除错误信息
                const errorDiv = document.getElementById('authError');
                if (errorDiv) {
                    errorDiv.classList.remove('show');
                }
            } else {
                updateButton();
            }
        }, 1000);
    }

    // 检查token是否即将过期并刷新
    async checkTokenExpiration() {
        if (!this.authToken) return;

        try {
            // 解析JWT payload（简单解析，不验证签名）
            const parts = this.authToken.split('.');
            if (parts.length !== 3) return;

            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const now = Math.floor(Date.now() / 1000);

            // 如果token在1小时内过期，尝试刷新
            if (payload.exp && payload.exp - now < 3600) {
                console.log('Token即将过期，尝试刷新...');
                await this.refreshTokens();
            }
        } catch (error) {
            console.error('检查token过期时间失败:', error);
        }
    }

    // 刷新CSRF token
    async refreshCSRFToken() {
        if (!this.isAuthenticated) return false;

        try {
            console.log('正在刷新CSRF token...');

            // 使用当前的认证信息请求新的CSRF token
            const config = this.getRequestConfig({
                method: 'POST',
                body: new FormData() // 空的表单数据
            });

            // 临时移除CSRF token以避免验证失败
            const oldCSRFToken = this.csrfToken;
            delete config.headers['X-CSRF-Token'];

            const response = await fetch('/api/auth/refresh-csrf', config);

            if (response.ok) {
                const data = await response.json();
                if (data.csrfToken) {
                    this.csrfToken = data.csrfToken;
                    console.log('CSRF token刷新成功');

                    // 更新存储的认证信息
                    this.saveAuth(this.authToken, this.csrfToken, this.usesCookies);
                    return true;
                }
            }

            // 如果刷新失败，恢复旧token
            this.csrfToken = oldCSRFToken;
            console.log('CSRF token刷新失败，状态:', response.status);
            return false;

        } catch (error) {
            console.error('刷新CSRF token失败:', error);
            return false;
        }
    }

    // 刷新所有token
    async refreshTokens() {
        // 先尝试刷新CSRF token
        const csrfRefreshed = await this.refreshCSRFToken();

        if (!csrfRefreshed) {
            console.log('CSRF token刷新失败，可能需要重新登录');
            // 可以选择清除认证信息或显示重新登录提示
            // this.clearStoredAuth();
            // if (await this.checkAuthRequired()) {
            //     this.showAuthModal();
            // }
        }
    }

    // 获取认证头
    getAuthHeaders() {
        const headers = {};

        // 如果不使用Cookie模式，添加Authorization头
        if (!this.usesCookies && this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // 添加CSRF token头（如果有）
        if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
            // console.log('添加CSRF token到请求头:', this.csrfToken.substring(0, 20) + '...');
        } else {
            // console.warn('警告: 缺少CSRF token');
        }

        return headers;
    }

    // 获取请求配置（包括credentials）
    getRequestConfig(options = {}) {
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };

        // 如果使用Cookie模式，确保发送Cookie
        if (this.usesCookies) {
            config.credentials = 'same-origin';
        }

        return config;
    }

    // 智能请求方法 - 自动处理token刷新
    async smartFetch(url, options = {}) {
        // 对于需要CSRF验证的请求，先检查token状态
        if (options.method && options.method !== 'GET' && this.isAuthenticated) {
            // 检查CSRF token是否可能过期（简单检查：如果超过45分钟就刷新）
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                try {
                    const authData = JSON.parse(stored);
                    const now = Date.now();
                    const age = now - authData.timestamp;

                    // 如果超过45分钟，尝试刷新CSRF token
                    if (age > 45 * 60 * 1000) {
                        console.log('CSRF token可能过期，尝试刷新...');
                        await this.refreshCSRFToken();
                    }
                } catch (e) {
                    console.log('检查token年龄失败:', e);
                }
            }
        }

        const config = this.getRequestConfig(options);
        return fetch(url, config);
    }

    // 注销
    async logout() {
        try {
            // 如果使用Cookie模式，调用服务器注销API
            if (this.usesCookies) {
                await fetch('/api/auth', {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
            }
        } catch (error) {
            console.error('服务器注销失败:', error);
        }

        // 清除本地认证信息
        this.clearStoredAuth();

        // 清除实例状态
        this.authToken = null;
        this.csrfToken = null;
        this.usesCookies = false;
        this.isAuthenticated = false;

        // 隐藏存储信息区域
        const storageSection = document.querySelector('.storage-info');
        if (storageSection) {
            storageSection.style.display = 'none';
        }

        // 重新加载页面以确保完全清理状态
        location.reload();
    }

    // 修复: 增强的认证状态检查方法
    async checkAuthStatus_7ree() {
        try {
            console.log('执行增强认证状态检查');
            
            // 检查本地存储是否完整
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                console.log('本地存储丢失，需要重新认证');
                this.handleAuthLoss_7ree();
                return;
            }
            
            // 解析存储的认证数据，检查是否在有效期内
            try {
                const authData = JSON.parse(stored);
                const now = Date.now();
                const expiry = authData.timestamp + (7 * 24 * 60 * 60 * 1000); // 7天有效期
                
                // 如果存储的数据已过期，直接清除
                if (now >= expiry) {
                    console.log('存储的认证信息已过期，清除认证状态');
                    this.handleAuthLoss_7ree();
                    return;
                }
                
                // 如果距离过期还有超过1小时，跳过网络验证
                if (expiry - now > 60 * 60 * 1000) {
                    console.log('认证信息仍在有效期内，跳过网络验证');
                    return;
                }
            } catch (e) {
                console.error('解析认证数据失败:', e);
                this.handleAuthLoss_7ree();
                return;
            }
            
            // 只有在认证数据即将过期时才进行网络验证
            console.log('认证数据即将过期，进行网络验证');
            const isValid = await this.validateStoredTokenWithRetry();
            if (!isValid) {
                console.log('Token网络验证失败，需要重新认证');
                this.handleAuthLoss_7ree();
                return;
            }
            
            console.log('认证状态检查通过');
        } catch (error) {
            console.error('认证状态检查失败:', error);
            // 网络错误不应该导致认证丢失，只记录错误
            console.log('由于网络错误跳过本次认证检查');
        }
    }
    
    // 修复: 处理认证丢失的方法
    handleAuthLoss_7ree() {
        console.log('处理认证丢失');
        this.clearStoredAuth();
        this.isAuthenticated = false;
        this.authToken = null;
        this.csrfToken = null;
        
        // 显示认证模态框
        this.showAuthModal();
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();

// 修复: 优化的token检查策略
setInterval(() => {
    if (window.authManager && window.authManager.isAuthenticated) {
        window.authManager.checkTokenExpiration();
        // 每10分钟进行一次认证状态检查（降低频率）
        window.authManager.checkAuthStatus_7ree();
    }
}, 10 * 60 * 1000); // 每10分钟检查一次