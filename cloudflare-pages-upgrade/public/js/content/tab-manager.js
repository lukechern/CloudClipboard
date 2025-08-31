// 标签切换功能模块

// 初始化标签切换功能
function initTabManager() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.dataset.filter;

            // 更新标签状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 控制批量操作按钮的显示/隐藏
            const batchOperationBtn = document.getElementById('batchOperation');
            if (batchOperationBtn) {
                if (filter === 'archived') {
                    // 存档模式下隐藏批量操作按钮
                    batchOperationBtn.style.display = 'none';
                } else {
                    // 缓存模式下显示批量操作按钮
                    batchOperationBtn.style.display = 'flex';
                }
            }

            // 如果正在刷新，先停止动画
            if (isRefreshing) {
                stopRefreshAnimation();
            }

            // 加载对应的记录
            loadRecords(filter);
        });
    });
}

// 初始化刷新按钮事件
function initRefreshButton() {
    const refreshBtn = document.getElementById('refreshRecords');
    if (refreshBtn) {
        // 添加点击事件
        refreshBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('刷新按钮被点击');
            triggerRefresh();
        });

        // 为手机版添加触摸事件支持
        refreshBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('刷新按钮触摸结束');
            triggerRefresh();
        });

        // 防止触摸时的默认行为
        refreshBtn.addEventListener('touchstart', function (e) {
            e.stopPropagation();
        });

        refreshBtn.addEventListener('touchmove', function (e) {
            e.stopPropagation();
        });
    }
}