// 存储信息和认证管理功能
class StorageHandler {
    constructor() {
        this.initialDataLoaded = false;
        this.init();
    }

    init() {
        this.setupAuthEventListeners();
        this.setupInitialization();
    }

    // 设置认证事件监听器
    setupAuthEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // 监听认证成功事件
            window.addEventListener('authSuccess', () => {
                console.log('认证成功事件触发，initialDataLoaded:', this.initialDataLoaded);
                // 认证成功后，如果还没有进行初始数据加载，则加载数据
                if (!this.initialDataLoaded) {
                    console.log('认证成功后加载数据');
                    this.loadDataAfterAuth();
                }
            });
        });
    }

    // 设置初始化流程
    setupInitialization() {
        document.addEventListener('DOMContentLoaded', () => {
            // 等待内容模块加载完成后再初始化
            setTimeout(() => this.checkAndInitialize(), 100);

            // 自动读取剪贴板
            setTimeout(() => {
                this.autoReadClipboard();
            }, 500);
        });
    }

    // 认证成功后加载数据
    loadDataAfterAuth() {
        // 确保内容模块已加载
        const loadDataAfterAuth = () => {
            if (typeof loadRecords === 'function') {
                loadRecords();
            }
            if (typeof loadStorageInfo === 'function') {
                loadStorageInfo();
            } else {
                this.loadStorageInfo();
            }
            this.initialDataLoaded = true;
        };

        // 检查函数是否就绪
        const checkAndLoadAfterAuth = () => {
            if (typeof loadRecords === 'function') {
                loadDataAfterAuth();
            } else {
                setTimeout(checkAndLoadAfterAuth, 50);
            }
        };

        checkAndLoadAfterAuth();
    }

    // 检查并初始化
    checkAndInitialize() {
        if (typeof loadRecords === 'function') {
            console.log('loadRecords函数已就绪，开始初始化');
            this.initializeAfterModulesLoaded();
        } else {
            console.log('loadRecords函数尚未就绪，继续等待...');
            setTimeout(() => this.checkAndInitialize(), 100);
        }
    }

    // 模块加载完成后初始化
    initializeAfterModulesLoaded() {
        console.log('开始初始化，检查认证状态');
        console.log('authManager存在:', !!window.authManager);
        console.log('已认证:', window.authManager?.isAuthenticated);
        console.log('initialDataLoaded:', this.initialDataLoaded);
        console.log('loadRecords函数存在:', typeof loadRecords === 'function');

        // 检查是否需要认证
        const authRequired = window.authManager && window.authManager.authRequired;
        const isAuthenticated = window.authManager && window.authManager.isAuthenticated;
        
        console.log('需要认证:', authRequired);
        console.log('已认证:', isAuthenticated);

        // 如果不需要认证或者已经认证成功，才加载数据
        if (!authRequired || isAuthenticated) {
            if (!this.initialDataLoaded) {
                console.log('开始加载初始数据');
                if (typeof loadRecords === 'function') {
                    loadRecords();
                } else {
                    console.error('loadRecords函数不存在！');
                }
                if (typeof loadStorageInfo === 'function') {
                    loadStorageInfo();
                } else {
                    this.loadStorageInfo();
                    console.error('loadStorageInfo函数不存在！使用内置函数');
                }
                this.initialDataLoaded = true;
            } else {
                console.log('初始数据已经加载过了');
            }
        } else {
            console.log('需要认证但未认证，不加载记录，隐藏存储信息');
            // 如果需要认证但还未认证，隐藏存储信息
            const storageSection = document.querySelector('.storage-info');
            if (storageSection) {
                storageSection.style.display = 'none';
            }
            
            // 不加载记录，但调用loadRecords来显示登录提示
            if (typeof loadRecords === 'function') {
                loadRecords();
            }
        }
    }

    // 加载存储信息
    loadStorageInfo() {
        const requestConfig = window.authManager ?
            window.authManager.getRequestConfig() : {};

        fetch('/api/storage', requestConfig)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // 检查是否有错误信息
                if (data.error) {
                    throw new Error(data.error);
                }
                this.displayStorageInfo(data);
            })
            .catch(error => {
                console.error('加载存储信息失败:', error);
                // 如果加载失败，显示默认信息
                this.displayStorageInfo({
                    type: 'Cloudflare',
                    location: 'D1数据库',
                    description: 'Cloudflare (云端 D1 数据库)',
                    status: '获取失败'
                });
            });
    }

    // 显示存储信息（简化版，只显示存储位置）
    displayStorageInfo(storageInfo) {
        const container = document.getElementById('storage-info-container');
        const storageSection = document.querySelector('.storage-info');

        if (!container || !storageSection) return;

        // 检查是否已登录
        if (!window.authManager || !window.authManager.isAuthenticated) {
            // 未登录时隐藏整个存储信息区域
            storageSection.style.display = 'none';
            return;
        }

        // 已登录时显示存储信息
        storageSection.style.display = 'block';

        // 处理可能的undefined值
        const type = storageInfo.type || 'Cloudflare';
        const location = storageInfo.location || 'D1数据库';
        const description = storageInfo.description || `${type} (${location})`;

        const html = `
            <div class="storage-info-item">
                <span class="storage-info-label">数据存储位置:</span>
                <span class="storage-info-value"><a href="./init_db.html" target="_blank">${description}</a></span>
            </div>
            <div class="logout-section">
                <a href="#" id="logoutLink" class="logout-link">退出登录</a>
            </div>
        `;

        container.innerHTML = html;

        // 绑定退出链接事件
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    // 处理退出登录
    handleLogout(e) {
        e.preventDefault();

        if (window.authManager) {
            // 使用自定义确认对话框，带有退出登录的特殊样式
            if (typeof showConfirm === 'function') {
                showConfirm(
                    '退出登录',
                    '确定要退出登录吗？这将清除所有本地认证信息，您需要重新输入密码才能继续使用。',
                    () => {
                        window.authManager.logout();
                    },
                    {
                        type: 'logout',
                        confirmText: '退出登录',
                        cancelText: '取消'
                    }
                );
            } else {
                // 降级方案：使用原生确认框
                if (confirm('确定要退出登录吗？这将清除所有本地认证信息，您需要重新输入密码才能继续使用。')) {
                    window.authManager.logout();
                }
            }
        }
    }

    // 自动读取剪贴板功能
    async autoReadClipboard() {
        // 检查是否为HTTPS环境
        if (window.location.protocol !== 'https:') {
            console.log('需要HTTPS环境才能访问剪贴板');
            return;
        }

        // 检查浏览器是否支持剪贴板API
        if (!navigator.clipboard) {
            console.log('浏览器不支持剪贴板API');
            return;
        }

        const contentInput = document.getElementById('content-input');
        if (!contentInput) {
            console.log('未找到内容输入框');
            return;
        }

        // 如果输入框已有内容或已有图片，不覆盖
        if (contentInput.value.trim() || (window.clipboardHandler && window.clipboardHandler.hasImages())) {
            console.log('已有内容，跳过自动读取剪贴板');
            return;
        }

        // 尝试使用剪贴板处理器自动读取
        if (window.clipboardHandler) {
            try {
                await window.clipboardHandler.readClipboard();
            } catch (err) {
                console.log('自动读取剪贴板失败:', err.message);
                // 如果新API失败，尝试只读取文本
                try {
                    if (navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text && text.trim()) {
                            contentInput.value = text.trim();

                            // 更新清空按钮状态
                            const textareaContainer = document.querySelector('.textarea-container');
                            if (textareaContainer) {
                                textareaContainer.classList.add('has-content');
                            }

                            // 显示提示信息
                            if (typeof showNotification === 'function') {
                                showNotification('已自动读取剪贴板文本');
                            }
                        }
                    }
                } catch (textErr) {
                    console.log('无法读取剪贴板文本:', textErr.message);
                }
            }
        }
    }
}

// 导出到全局
window.StorageHandler = StorageHandler;