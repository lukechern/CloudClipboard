// 全局标志，防止初始加载时重复调用
window.initialDataLoaded = false;

// 页面加载完成后的处理
document.addEventListener('DOMContentLoaded', function () {
    // 监听认证成功事件
    window.addEventListener('authSuccess', function() {
        // console.log('认证成功事件触发，initialDataLoaded:', window.initialDataLoaded);
        // 认证成功后，如果还没有进行初始数据加载，则加载数据
        if (!window.initialDataLoaded) {
            // console.log('认证成功后加载数据');
            if (typeof loadRecords === 'function') {
                loadRecords();
            }
            if (typeof loadStorageInfo === 'function') {
                loadStorageInfo();
            }
            window.initialDataLoaded = true;
        }
    });
    
    // 延迟检查认证状态，避免与认证管理器初始化冲突
    setTimeout(() => {
        // console.log('检查认证状态，authManager存在:', !!window.authManager, 
        //            '已认证:', window.authManager?.isAuthenticated, 
        //            'initialDataLoaded:', window.initialDataLoaded);
        
        // 如果没有认证管理器或者已经认证成功，直接加载数据
        if (!window.authManager || window.authManager.isAuthenticated) {
            if (!window.initialDataLoaded) {
                // console.log('页面加载时加载数据');
                if (typeof loadRecords === 'function') {
                    loadRecords();
                }
                if (typeof loadStorageInfo === 'function') {
                    loadStorageInfo();
                }
                window.initialDataLoaded = true;
            }
        }
        // 如果需要认证但还未认证，等待认证成功事件
    }, 200);

    // 检查是否有成功消息
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('saved')) {
        showNotification('内容已保存到云端');
    }

    // 自动读取剪贴板
    setTimeout(function () {
        autoReadClipboard();
    }, 500);

    // 获取相关元素
    const header = document.querySelector('.header');
    const backToTopBtn = document.getElementById('backToTop');
    const batchOperationBtn = document.getElementById('batchOperation');
    const container = document.querySelector('.container');

    // 创建批量操作工具栏
    const batchToolbar = document.createElement('div');
    batchToolbar.id = 'batchToolbar';
    batchToolbar.className = 'batch-toolbar';
    batchToolbar.innerHTML = 
        '<div class="actions">' +
            '<button class="complete-btn">' +
                '<img src="img/complete.svg" class="icon" alt="完成" width="16" height="16">' +
                '完成' +
            '</button>' +
            '<span class="count">已选择 0 项</span>' +
        '</div>' +
        '<div class="actions">' +
            '<button class="delete-btn" disabled>' +
                '<img src="img/delete.svg" class="icon" alt="删除" width="16" height="16">' +
                '批量删除' +
            '</button>' +
        '</div>';
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

    // 处理清空按钮功能
    const textarea = document.getElementById('content-input');
    const clearBtn = document.getElementById('clearBtn');
    const textareaContainer = document.querySelector('.textarea-container');

    if (textarea && clearBtn && textareaContainer) {
        // 监听textarea内容变化
        function updateClearButtonVisibility() {
            if (textarea.value.trim().length > 0) {
                textareaContainer.classList.add('has-content');
            } else {
                textareaContainer.classList.remove('has-content');
            }
        }

        // 监听输入事件
        textarea.addEventListener('input', updateClearButtonVisibility);
        textarea.addEventListener('paste', function () {
            setTimeout(() => {
                updateClearButtonVisibility();

            }, 10);
        });

        // 清空内容的函数
        function clearTextarea() {
            textarea.value = '';
            updateClearButtonVisibility();
            textarea.focus();
            if (typeof showNotification === 'function') {
                showNotification('内容已清空');
            }
        }

        // 清空按钮点击事件
        clearBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            clearTextarea();
        });

        // 键盘快捷键支持
        textarea.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
                e.preventDefault();
                clearTextarea();
            }
        });

        // 初始化时检查内容
        updateClearButtonVisibility();
    }
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
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig({
                    method: 'POST',
                    body: formData
                }) : {
                    method: 'POST',
                    body: formData
                };
            
            fetch('/api/records', requestConfig)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('网络响应失败');
                    }
                    return response.json();
                })
                .then(data => {
                    // 检查服务器返回的是否是错误信息
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    // 清空并重新启用表单
                    textarea.value = '';

                    // 更新清空按钮状态
                    const textareaContainer = document.querySelector('.textarea-container');
                    if (textareaContainer) {
                        textareaContainer.classList.remove('has-content');
                    }

                    if (submitBtn) {
                        restoreButtonState(submitBtn);
                    }

                    // 重新加载当前过滤器的记录
                    if (typeof loadRecords === 'function') {
                        loadRecords(window.currentFilter || 'cache');
                    }

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
            displayStorageInfo(data);
        })
        .catch(error => {
            console.error('加载存储信息失败:', error);
            // 如果加载失败，显示默认信息
            displayStorageInfo({
                type: 'Cloudflare',
                location: 'D1数据库',
                description: 'Cloudflare (云端 D1 数据库)',
                status: '获取失败'
            });
        });
}

// 显示存储信息（简化版，只显示存储位置）
function displayStorageInfo(storageInfo) {
    const container = document.getElementById('storage-info-container');
    if (!container) return;

    // 处理可能的undefined值
    const type = storageInfo.type || 'Cloudflare';
    const location = storageInfo.location || 'D1数据库';
    const description = storageInfo.description || `${type} (${location})`;

    const html = `
        <div class="storage-info-item">
            <span class="storage-info-label">数据存储位置:</span>
            <span class="storage-info-value"><a href="./init_db.html" target="_blank">${description}</a></span>
        </div>
    `;

    container.innerHTML = html;
}


// 自动读取剪贴板功能
async function autoReadClipboard() {
    // 检查是否为HTTPS环境
    if (window.location.protocol !== 'https:') {
        console.log('需要HTTPS环境才能访问剪贴板');
        return;
    }

    // 检查浏览器是否支持剪贴板API
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        console.log('浏览器不支持剪贴板API');
        return;
    }

    const contentInput = document.getElementById('content-input');
    if (!contentInput) {
        console.log('未找到内容输入框');
        return;
    }

    // 如果输入框已有内容，不覆盖
    if (contentInput.value.trim()) {
        console.log('输入框已有内容，跳过自动读取剪贴板');
        return;
    }

    // 读取剪贴板内容
    try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
            contentInput.value = text.trim();
            // console.log('已自动读取剪贴板内容');

            // 更新清空按钮状态
            const textareaContainer = document.querySelector('.textarea-container');
            if (textareaContainer) {
                textareaContainer.classList.add('has-content');
            }

            // 显示提示信息
            if (typeof showNotification === 'function') {
                showNotification('已自动读取剪贴板内容');
            }
        }
    } catch (err) {
        console.log('无法读取剪贴板:', err.message);
    }
}

