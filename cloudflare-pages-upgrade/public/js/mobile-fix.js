// 手机版修复脚本
(function() {
    'use strict';
    
    // 检测是否为手机版
    const isMobile = window.innerWidth <= 768;
    const isTouch = 'ontouchstart' in window;
    
    if (!isMobile && !isTouch) return;
    

    
    // 修复1: 防止iOS Safari的双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // 修复2: 改善触摸响应
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // 修复3: 强制刷新按钮可点击
    function ensureRefreshButtonWorks() {
        const refreshBtn = document.getElementById('refreshRecords');
        if (!refreshBtn) return;
        
        // 移除所有现有事件监听器
        const newRefreshBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
        
        // 添加新的事件监听器
        newRefreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('手机版刷新按钮点击');
            if (typeof triggerRefresh === 'function') {
                triggerRefresh();
            }
        }, {passive: false});
        
        newRefreshBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('手机版刷新按钮触摸');
            if (typeof triggerRefresh === 'function') {
                triggerRefresh();
            }
        }, {passive: false});
        
        console.log('刷新按钮事件已重新绑定');
    }
    
    // 修复4: 强制加载记录
    function forceLoadRecords() {
        if (window.initialDataLoaded) return;
        
        console.log('强制加载记录...');
        
        // 检查认证状态
        const isAuthenticated = !window.authManager || window.authManager.isAuthenticated;
        
        if (isAuthenticated && typeof loadRecords === 'function') {
            loadRecords();
            window.initialDataLoaded = true;
            console.log('强制加载完成');
        }
    }
    
    // 修复5: 添加手机版专用的重试机制
    function addRetryMechanism() {
        let retryCount = 0;
        const maxRetries = 3;
        
        function checkAndRetry() {
            retryCount++;
            
            const recordsContainer = document.getElementById('records-container');
            const hasRecords = recordsContainer && recordsContainer.innerHTML.trim() !== '';
            
            if (!hasRecords && retryCount <= maxRetries) {
                console.log(`手机版重试加载记录 (${retryCount}/${maxRetries})`);
                forceLoadRecords();
                
                if (retryCount < maxRetries) {
                    setTimeout(checkAndRetry, 2000);
                }
            }
        }
        
        // 页面加载后开始检查
        setTimeout(checkAndRetry, 3000);
    }
    
    // 页面加载完成后应用修复
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                ensureRefreshButtonWorks();
                forceLoadRecords();
                addRetryMechanism();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            ensureRefreshButtonWorks();
            forceLoadRecords();
            addRetryMechanism();
        }, 1000);
    }
    
    // 页面可见性变化时重新检查
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(() => {
                ensureRefreshButtonWorks();
                if (!window.initialDataLoaded) {
                    forceLoadRecords();
                }
            }, 500);
        }
    });
    
    console.log('手机版修复脚本已加载');
})();