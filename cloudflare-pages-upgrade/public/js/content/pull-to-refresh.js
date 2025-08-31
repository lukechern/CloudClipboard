// 下拉刷新功能模块

// 下拉刷新相关变量
let pullToRefreshStartY = 0;
let pullToRefreshCurrentY = 0;
let pullToRefreshThreshold = 80;
let isPulling = false;
let refreshIndicator = null;
let isRefreshing = false;

// 开始刷新动画
function startRefreshAnimation() {
    if (isRefreshing) return;
    isRefreshing = true;

    const refreshBtn = document.getElementById('refreshRecords');
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;

        // 直接设置内联样式确保动画工作
        const icon = refreshBtn.querySelector('.icon');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
            icon.style.transform = 'none';
            icon.style.transition = 'none';
        }

        // 强制重绘以确保动画立即开始
        refreshBtn.offsetHeight;
    }
}

// 停止刷新动画
function stopRefreshAnimation() {
    isRefreshing = false;

    const refreshBtn = document.getElementById('refreshRecords');
    if (refreshBtn) {
        refreshBtn.classList.remove('refreshing');
        refreshBtn.disabled = false;

        // 清除内联样式，恢复CSS控制
        const icon = refreshBtn.querySelector('.icon');
        if (icon) {
            icon.style.animation = '';
            icon.style.transform = '';
            icon.style.transition = '';
        }
    }
}

// 创建刷新指示器
function createRefreshIndicator() {
    if (refreshIndicator) return refreshIndicator;

    const textareaContainer = document.querySelector('.textarea-container');
    if (!textareaContainer) return null;

    // 确保容器有相对定位
    if (getComputedStyle(textareaContainer).position === 'static') {
        textareaContainer.style.position = 'relative';
    }

    refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-refresh-indicator';
    refreshIndicator.innerHTML = `
        <div class="refresh-spinner">
            <img src="img/refresh.svg" class="refresh-icon" alt="刷新" width="20" height="20">
        </div>
        <span class="refresh-text">下拉刷新</span>
    `;
    textareaContainer.appendChild(refreshIndicator);
    return refreshIndicator;
}

// 触发刷新
function triggerRefresh() {
    if (isRefreshing) {
        console.log('正在刷新中，跳过重复请求');
        return; // 防止重复刷新
    }

    console.log('开始刷新记录，当前过滤器:', window.currentFilter || 'cache');

    // 开始刷新动画
    startRefreshAnimation();

    const indicator = createRefreshIndicator();
    if (indicator) {
        indicator.classList.add('refreshing');
        const refreshText = indicator.querySelector('.refresh-text');
        if (refreshText) {
            refreshText.textContent = '正在刷新...';
        }
    }

    // 刷新当前过滤器的记录
    try {
        loadRecords(window.currentFilter || 'cache');

        // 显示刷新提示
        if (typeof showNotification === 'function') {
            showNotification('正在刷新记录...');
        }
    } catch (error) {
        console.error('刷新记录时出错:', error);
        stopRefreshAnimation();

        if (typeof showNotification === 'function') {
            showNotification('刷新失败，请重试');
        }
    }
}

// 初始化下拉刷新事件
function initPullToRefresh() {
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isAtTop = false;

    // 检查是否在页面顶部
    function checkIfAtTop() {
        return window.scrollY <= 0;
    }

    // 触摸开始
    document.addEventListener('touchstart', function (e) {
        // 检查是否点击了刷新按钮或其他交互元素
        const target = e.target;
        const isInteractiveElement = target.closest('.refresh-btn') ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('.record-actions') ||
            target.closest('.tab-btn');

        if (isInteractiveElement) {
            console.log('触摸到交互元素，跳过下拉刷新');
            return;
        }

        if (checkIfAtTop()) {
            touchStartY = e.touches[0].clientY;
            isAtTop = true;
        }
    }, { passive: true });

    // 触摸移动
    document.addEventListener('touchmove', function (e) {
        if (!isAtTop) return;

        // 检查是否在交互元素上
        const target = e.target;
        const isInteractiveElement = target.closest('.refresh-btn') ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('.record-actions') ||
            target.closest('.tab-btn');

        if (isInteractiveElement) {
            return;
        }

        touchCurrentY = e.touches[0].clientY;
        const pullDistance = touchCurrentY - touchStartY;

        // 只有在页面顶部且向下拉时才处理
        if (checkIfAtTop() && pullDistance > 0) {
            isPulling = true;

            const indicator = createRefreshIndicator();
            if (!indicator) return;

            indicator.style.display = 'flex';

            // 计算拉动进度
            const progress = Math.min(pullDistance / pullToRefreshThreshold, 1);
            indicator.style.opacity = progress;

            // 更新指示器状态
            const refreshIcon = indicator.querySelector('.refresh-icon');
            const refreshText = indicator.querySelector('.refresh-text');

            if (pullDistance >= pullToRefreshThreshold) {
                refreshIcon.style.transform = 'rotate(180deg)';
                refreshText.textContent = '释放刷新';
                indicator.classList.add('ready');
            } else {
                refreshIcon.style.transform = 'rotate(0deg)';
                refreshText.textContent = '下拉刷新';
                indicator.classList.remove('ready');
            }

            // 阻止默认滚动行为
            if (pullDistance > 10) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // 触摸结束
    document.addEventListener('touchend', function (e) {
        if (!isPulling) return;

        const pullDistance = touchCurrentY - touchStartY;
        const indicator = createRefreshIndicator();

        if (pullDistance >= pullToRefreshThreshold) {
            // 触发刷新
            triggerRefresh();
        } else {
            // 隐藏指示器
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 300);
        }

        // 重置状态
        isPulling = false;
        isAtTop = false;
        touchStartY = 0;
        touchCurrentY = 0;
    }, { passive: true });
}