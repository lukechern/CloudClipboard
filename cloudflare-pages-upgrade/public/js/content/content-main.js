// 内容管理主模块 - 统一初始化和协调各个功能模块

// 页面加载完成后的初始化
// 将初始化逻辑封装为独立函数，确保在DOMContentLoaded已触发的情况下也能立即执行
function initContentModules_7ree() {
    // 初始化标签管理器
    if (window.TagManager) {
        console.log('初始化标签管理器...');
        window.TagManager.init();
    }
    
    // 初始化标签管理器
    initTabManager();
    
    // 初始化刷新按钮
    initRefreshButton();
    
    // 初始化下拉刷新
    initPullToRefresh();
    
    // 延迟执行调试功能
    setTimeout(debugMobileIssues, 2000);
    
    // 检查存档功能支持
    setTimeout(() => {
        checkArchiveSupport();
    }, 1000);
}

// 兼容处理：若DOMContentLoaded尚未触发，则监听；否则立即执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initContentModules_7ree();
    });
} else {
    // 文档已就绪或已完成，直接初始化
    initContentModules_7ree();
}