/**
 * 主入口文件 - 负责加载和初始化所有功能模块
 * 重构后的模块化架构，将原有的庞大文件拆分为三个专门的功能模块
 */

// 模块实例
let uiController = null;
let formManager = null;
let storageHandler = null;

// 全局兼容性支持（保持向后兼容）
window.initialDataLoaded = false;
window.currentFilter = 'cache';

// 动态加载模块
function loadModule(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 初始化所有模块
function initializeModules() {
    console.log('初始化功能模块...');
    
    // 实例化各个模块
    try {
        if (window.UIController) {
            uiController = new window.UIController();
            console.log('UI控制器模块已初始化');
        }
        
        if (window.FormManager) {
            formManager = new window.FormManager();
            console.log('表单管理器模块已初始化');
        }
        
        if (window.StorageHandler) {
            storageHandler = new window.StorageHandler();
            console.log('存储处理器模块已初始化');
        }
        
        console.log('所有模块初始化完成');
    } catch (error) {
        console.error('模块初始化失败:', error);
    }
}

// 页面加载完成后开始加载模块
document.addEventListener('DOMContentLoaded', async function() {
    console.log('开始加载主功能模块...');
    
    try {
        // 并行加载所有模块
        await Promise.all([
            loadModule('./js/main/ui-controller.js'),
            loadModule('./js/main/form-manager.js'),
            loadModule('./js/main/storage-handler.js')
        ]);
        
        // 等待模块脚本执行
        setTimeout(initializeModules, 100);
        
    } catch (error) {
        console.error('模块加载失败:', error);
        // 降级处理：提供基本功能
        console.warn('使用降级模式运行');
    }
});

// 向后兼容性函数（保持原有的全局函数可用）
function loadStorageInfo() {
    if (storageHandler && storageHandler.loadStorageInfo) {
        storageHandler.loadStorageInfo();
    } else {
        console.error('StorageHandler 模块未正确加载');
    }
}

function autoReadClipboard() {
    if (storageHandler && storageHandler.autoReadClipboard) {
        storageHandler.autoReadClipboard();
    } else {
        console.error('StorageHandler 模块未正确加载');
    }
}

// 批量操作相关函数（向后兼容）
function enterBatchMode() {
    if (uiController && uiController.enterBatchMode) {
        uiController.enterBatchMode();
    }
}

function exitBatchMode() {
    if (uiController && uiController.exitBatchMode) {
        uiController.exitBatchMode();
    }
}

function updateBatchToolbarCount() {
    if (uiController && uiController.updateBatchToolbarCount) {
        uiController.updateBatchToolbarCount();
    }
}

// 导出到全局以便其他模块使用
window.mainApp = {
    uiController: () => uiController,
    formManager: () => formManager,
    storageHandler: () => storageHandler
};

