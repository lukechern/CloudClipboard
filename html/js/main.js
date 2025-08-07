// 页面加载完成后的处理
document.addEventListener('DOMContentLoaded', function () {
    // 加载记录
    loadRecords();

    // 加载存储信息
    loadStorageInfo();

    // 检查是否有成功消息
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('saved')) {
        showNotification('内容已保存到云端');
    }

    // 获取相关元素
    const header = document.querySelector('.header');
    const backToTopBtn = document.getElementById('backToTop');
    const batchOperationBtn = document.getElementById('batchOperation');
    const container = document.querySelector('.container');

    // 创建批量操作工具栏
    const batchToolbar = document.createElement('div');
    batchToolbar.id = 'batchToolbar';
    batchToolbar.className = 'batch-toolbar';
    batchToolbar.innerHTML = `
        <div class="actions">
            <button class="complete-btn">
                <img src="html/img/complete.svg" class="icon" alt="完成" width="16" height="16">
                完成
            </button>
            <span class="count">已选择 0 项</span>
        </div>
        <div class="actions">
            <button class="delete-btn" disabled>
                <img src="html/img/delete.svg" class="icon" alt="删除" width="16" height="16">
                批量删除
            </button>
        </div>
    `;
    document.body.appendChild(batchToolbar);

    // 监听滚动事件
    window.addEventListener('scroll', function () {
        // 获取滚动位置
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 固定标题栏逻辑
        if (scrollTop > header.offsetTop) {
            header.classList.add('header-fixed');
            // 添加顶部边距以防止内容跳动
            container.style.paddingTop = header.offsetHeight + 'px';
        } else {
            header.classList.remove('header-fixed');
            container.style.paddingTop = '0';
        }

        // 显示/隐藏回到顶部按钮
        if (scrollTop > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // 回到顶部按钮点击事件
    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 批量操作按钮点击事件
    batchOperationBtn.addEventListener('click', function () {
        enterBatchMode();
    });

    // 完成按钮点击事件
    document.querySelector('.batch-toolbar .complete-btn').addEventListener('click', function () {
        exitBatchMode();
    });

    // 批量删除按钮点击事件
    document.querySelector('.batch-toolbar .delete-btn').addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('.record-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.dataset.id);

        if (ids.length > 0) {
            batchDeleteRecords(ids);
        }
    });

    // 监听复选框变化以更新计数
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('record-checkbox')) {
            updateBatchToolbarCount();
        }
    });
});

// 处理表单提交
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.input-section form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const textarea = form.querySelector('textarea');
            const submitBtn = form.querySelector('button[type="submit"]');

            // 获取表单数据
            const content = textarea.value.trim();

            // 验证内容是否为空
            if (!content) {
                showNotification('请输入要保存的内容');
                return;
            }

            // 添加加载状态
            if (submitBtn) {
                showLoadingState(submitBtn);
            }

            // 创建请求数据
            const formData = new FormData();
            formData.append('content', content);

            // 发送请求
            fetch('./index.php', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('网络响应失败');
                    }
                    return response.text();
                })
                .then(data => {
                    // 检查服务器返回的是否是错误信息
                    if (data.includes('保存失败') || data.includes('内容不能为空')) {
                        throw new Error(data);
                    }

                    // 清空并重新启用表单
                    textarea.value = '';

                    if (submitBtn) {
                        restoreButtonState(submitBtn);
                    }

                    // 重新加载记录
                    loadRecords();

                    // 显示成功消息
                    showNotification('内容已保存到云端');
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('保存失败: ' + (error.message || '未知错误'));

                    if (submitBtn) {
                        restoreButtonState(submitBtn);
                    }
                });
        });
    }
});
// 加载存储信息
function loadStorageInfo() {
    fetch('./index.php?get_storage_info=1')
        .then(response => response.json())
        .then(data => {
            displayStorageInfo(data);
        })
        .catch(error => {
            console.error('加载存储信息失败:', error);
            // 如果加载失败，显示默认信息
            displayStorageInfo({
                type: '未知',
                location: '未知',
                status: '获取失败'
            });
        });
}

// 显示存储信息（简化版，只显示存储位置）
function displayStorageInfo(storageInfo) {
    const container = document.getElementById('storage-info-container');
    if (!container) return;

    const html = `
        <div class="storage-info-item">
            <span class="storage-info-label">数据存储位置:</span>
            <span class="storage-info-value"><a href="./init_db.php" target="_blank">${storageInfo.type} (${storageInfo.location})</a></span>
        </div>
    `;

    container.innerHTML = html;
}