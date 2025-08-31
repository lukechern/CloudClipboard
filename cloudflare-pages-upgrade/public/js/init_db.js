// 数据库初始化功能 - 模块化重构版本
// 导入子模块（需要在HTML中按顺序加载）

// 主初始化管理类
class DatabaseInitManager {
    constructor() {
        // 等待DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // 初始化各个模块
        window.messageHandler = new MessageHandler();
        window.storageManager = new StorageManager();
        window.dbChecker = new DatabaseChecker();
        window.formHandler = new FormHandler();

        // 设置事件监听
        this.setupEventListeners();
        
        // 检查初始消息
        window.messageHandler.checkInitialMessage();
        
        // 初始化数据加载
        this.initializeData();
    }

    setupEventListeners() {
        // 监听认证成功事件
        window.addEventListener('authSuccess', () => {
            console.log('认证成功，加载初始化页面数据');
            this.loadInitialData();
        });
        
        // 延迟检查认证状态
        setTimeout(() => {
            if (!window.authManager || window.authManager.isAuthenticated) {
                console.log('无需认证或已认证，直接加载数据');
                this.loadInitialData();
            } else {
                console.log('等待认证完成...');
            }
        }, 200);
    }

    async initializeData() {
        // 显示调试区域（如果需要）
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug')) {
            const debugSection = document.getElementById('debug-section');
            if (debugSection) {
                debugSection.style.display = 'block';
            }
        }
    }

    async loadInitialData() {
        try {
            // 并行加载存储信息和检查表状态
            await Promise.all([
                window.storageManager.loadStorageDetails(),
                window.dbChecker.checkTableExists()
            ]);
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }
}

// 兼容性函数，保持原有API不变
function showMessage(msg, isSuccess) {
    if (window.messageHandler) {
        window.messageHandler.showMessage(msg, isSuccess);
    }
}

function loadStorageDetails() {
    if (window.storageManager) {
        return window.storageManager.loadStorageDetails();
    }
}

function checkTableExists() {
    if (window.dbChecker) {
        return window.dbChecker.checkTableExists();
    }
}

function checkTableStructure() {
    if (window.dbChecker && event && event.target) {
        return window.dbChecker.checkTableStructure(event.target);
    }
}

function debugAuth() {
    if (window.formHandler) {
        window.formHandler.debugAuth();
    }
}

function debugUpgrade() {
    if (window.formHandler) {
        return window.formHandler.debugUpgrade();
    }
}

// 全局实例
window.dbInitManager = new DatabaseInitManager();

