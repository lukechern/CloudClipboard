// 内容管理主模块 - 统一初始化和协调各个功能模块

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function () {
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
});