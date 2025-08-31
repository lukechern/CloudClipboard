// 表单处理和用户交互功能
class FormHandler {
    constructor() {
        this.init();
    }

    init() {
        // 处理创建表单提交
        const initForm = document.getElementById('init-form');
        if (initForm) {
            initForm.addEventListener('submit', (e) => this.handleInitForm(e));
        }
        
        // 处理升级表单提交
        const upgradeForm = document.getElementById('upgrade-form');
        if (upgradeForm) {
            upgradeForm.addEventListener('submit', (e) => this.handleUpgradeForm(e));
        }
    }

    // 处理初始化表单提交
    async handleInitForm(event) {
        event.preventDefault();
        
        const button = event.target.querySelector('.init-btn');
        const originalText = button.textContent;
        
        try {
            // 显示加载状态
            button.textContent = '正在创建...';
            button.disabled = true;
            
            // 发送请求
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig({
                    method: 'POST'
                }) : {
                    method: 'POST'
                };
            
            console.log('创建请求配置:', requestConfig);
            console.log('认证管理器状态:', this.getAuthStatus());
            
            const response = await fetch('/api/init', requestConfig);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            // 显示结果
            if (data.success) {
                window.messageHandler.showMessage(data.message, true);
                // 重新检查数据库状态
                await window.dbChecker.checkTableExists();
            } else {
                window.messageHandler.showMessage(data.message, false);
            }
            
        } catch (error) {
            // 显示错误
            window.messageHandler.showMessage('请求失败: ' + error.message, false);
        } finally {
            // 恢复按钮状态
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // 处理升级表单提交
    async handleUpgradeForm(event) {
        event.preventDefault();
        
        const button = event.target.querySelector('.upgrade-btn');
        const originalText = button.textContent;
        
        try {
            // 显示加载状态
            button.textContent = '正在升级...';
            button.disabled = true;
            
            // 创建表单数据
            const formData = new FormData();
            formData.append('action', 'upgrade');
            
            // 发送请求
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig({
                    method: 'POST',
                    body: formData
                }) : {
                    method: 'POST',
                    body: formData
                };
            
            console.log('升级请求配置:', requestConfig);
            console.log('认证管理器状态:', this.getAuthStatus());
            
            const response = await fetch('/api/init', requestConfig);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            // 显示结果
            if (data.success) {
                window.messageHandler.showMessage(data.message, true);
                // 重新检查数据库状态
                await window.dbChecker.checkTableExists();
            } else {
                window.messageHandler.showMessage(data.message, false);
            }
            
        } catch (error) {
            // 显示错误
            window.messageHandler.showMessage('请求失败: ' + error.message, false);
        } finally {
            // 恢复按钮状态
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // 获取认证状态信息
    getAuthStatus() {
        return {
            exists: !!window.authManager,
            isAuthenticated: window.authManager?.isAuthenticated,
            hasCSRF: !!window.authManager?.csrfToken,
            usesCookies: window.authManager?.usesCookies
        };
    }

    // 调试认证状态
    debugAuth() {
        const debugResult = document.getElementById('debug-result');
        const authInfo = {
            authManagerExists: !!window.authManager,
            isAuthenticated: window.authManager?.isAuthenticated,
            hasToken: !!window.authManager?.authToken,
            hasCSRF: !!window.authManager?.csrfToken,
            usesCookies: window.authManager?.usesCookies
        };
        debugResult.innerHTML = '<h5>认证状态:</h5><pre>' + JSON.stringify(authInfo, null, 2) + '</pre>';
    }

    // 调试升级功能
    async debugUpgrade() {
        const debugResult = document.getElementById('debug-result');
        debugResult.innerHTML = '测试升级中...';
        
        try {
            const formData = new FormData();
            formData.append('action', 'upgrade');
            
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig({
                    method: 'POST',
                    body: formData
                }) : {
                    method: 'POST',
                    body: formData
                };
            
            console.log('调试升级请求配置:', requestConfig);
            
            const response = await fetch('/api/init', requestConfig);
            const data = await response.json();
            
            if (response.ok) {
                debugResult.innerHTML = '<h5>升级成功:</h5><pre style="color: green;">' + JSON.stringify(data, null, 2) + '</pre>';
                // 重新检查数据库状态
                await window.dbChecker.checkTableExists();
            } else {
                debugResult.innerHTML = '<h5>升级失败 (' + response.status + '):</h5><pre style="color: red;">' + JSON.stringify(data, null, 2) + '</pre>';
            }
        } catch (error) {
            debugResult.innerHTML = '<h5>升级错误:</h5><pre style="color: red;">' + error.message + '</pre>';
        }
    }
}

// 消息处理类
class MessageHandler {
    // 显示消息
    showMessage(msg, isSuccess) {
        const container = document.getElementById('message-container');
        if (!container) {
            console.error('Message container not found');
            return;
        }
        container.innerHTML = `
            <div class="message ${isSuccess ? 'success' : 'error'}">
                ${msg}
            </div>
        `;
    }

    // 检查并显示初始消息
    checkInitialMessage() {
        if (typeof message !== 'undefined' && typeof success !== 'undefined' && message !== null) {
            this.showMessage(message, success);
        }
    }
}