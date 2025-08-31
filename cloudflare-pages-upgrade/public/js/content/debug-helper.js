// 调试功能模块

// 手机版调试和修复函数
function debugMobileIssues() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    console.log('=== 手机版调试信息 ===');
    console.log('屏幕宽度:', window.innerWidth);
    console.log('认证管理器存在:', !!window.authManager);
    console.log('已认证:', window.authManager?.isAuthenticated);
    console.log('初始数据已加载:', window.initialDataLoaded);
    console.log('当前过滤器:', window.currentFilter);

    // 检查关键元素
    const refreshBtn = document.getElementById('refreshRecords');
    const recordsContainer = document.getElementById('records-container');
    const loadingElement = document.getElementById('records-loading');

    console.log('刷新按钮存在:', !!refreshBtn);
    console.log('记录容器存在:', !!recordsContainer);
    console.log('加载元素存在:', !!loadingElement);

    if (refreshBtn) {
        console.log('刷新按钮可见:', refreshBtn.offsetParent !== null);
        console.log('刷新按钮禁用状态:', refreshBtn.disabled);
    }

    // 如果记录没有加载，尝试手动触发
    if (!window.initialDataLoaded && (!window.authManager || window.authManager.isAuthenticated)) {
        console.log('尝试手动加载记录...');
        setTimeout(() => {
            if (typeof loadRecords === 'function') {
                loadRecords();
                window.initialDataLoaded = true;
            }
        }, 1000);
    }
}