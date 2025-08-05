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

    // 自动读取剪贴板
    setTimeout(function () {
        autoReadClipboard();
    }, 500);

    // 添加用户交互监听器，在iframe环境中当用户点击时尝试读取剪贴板
    if (isInIframe()) {
        let hasTriedOnInteraction = false;

        const tryReadOnInteraction = function () {
            if (!hasTriedOnInteraction) {
                hasTriedOnInteraction = true;
                setTimeout(autoReadClipboard, 100);
            }
        };

        // 监听各种用户交互事件
        document.addEventListener('click', tryReadOnInteraction, { once: true });
        document.addEventListener('focus', tryReadOnInteraction, { once: true });
        document.addEventListener('keydown', tryReadOnInteraction, { once: true });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden && !hasTriedOnInteraction) {
                setTimeout(tryReadOnInteraction, 200);
            }
        });

        // 监听窗口焦点事件
        window.addEventListener('focus', function () {
            if (!hasTriedOnInteraction) {
                setTimeout(tryReadOnInteraction, 200);
            }
        });
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
                <img src="img/complete.svg" class="icon" alt="完成" width="16" height="16">
                完成
            </button>
            <span class="count">已选择 0 项</span>
        </div>
        <div class="actions">
            <button class="delete-btn" disabled>
                <img src="img/delete.svg" class="icon" alt="删除" width="16" height="16">
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
                // 如果用户手动粘贴了内容，隐藏剪贴板按钮
                hideClipboardButton();
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
            fetch('/api/records', {
                method: 'POST',
                headers: window.authManager ? window.authManager.getAuthHeaders() : {},
                body: formData
            })
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
    const headers = window.authManager ? window.authManager.getAuthHeaders() : {};

    fetch('/api/storage', { headers })
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
            <span class="storage-info-value"><a href="./init_db.html" target="_blank">${storageInfo.type} (${storageInfo.location})</a></span>
        </div>
    `;

    container.innerHTML = html;
}
// 检查是否在iframe中运行
function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

// 尝试通过postMessage与父窗口通信获取剪贴板内容
function requestClipboardFromParent() {
    if (isInIframe() && window.parent) {
        try {
            // 向父窗口发送请求剪贴板内容的消息
            window.parent.postMessage({
                type: 'REQUEST_CLIPBOARD',
                source: 'cloudclipboard'
            }, '*');

            console.log('已向父窗口请求剪贴板内容');
        } catch (e) {
            console.log('无法与父窗口通信:', e.message);
        }
    }
}

// 监听来自父窗口的消息
window.addEventListener('message', function (event) {
    // 验证消息来源和类型
    if (event.data && event.data.type === 'CLIPBOARD_CONTENT' && event.data.source === 'cloudclipboard') {
        const content = event.data.content;
        if (content && content.trim()) {
            const contentInput = document.getElementById('content-input');
            if (contentInput && !contentInput.value.trim()) {
                contentInput.value = content.trim();

                // 更新清空按钮状态
                const textareaContainer = document.querySelector('.textarea-container');
                if (textareaContainer) {
                    textareaContainer.classList.add('has-content');
                }

                // 隐藏剪贴板按钮
                hideClipboardButton();

                // 显示成功提示
                if (typeof showNotification === 'function') {
                    showNotification('已自动读取剪贴板内容');
                }

                console.log('已通过父窗口获取剪贴板内容');
            }
        }
    }
});

// 尝试获取焦点的函数
function tryToFocus() {
    return new Promise((resolve) => {
        // 尝试聚焦到窗口
        window.focus();

        // 聚焦到输入框
        const contentInput = document.getElementById('content-input');
        if (contentInput) {
            contentInput.focus();
        }

        // 给一点时间让焦点生效
        setTimeout(() => {
            resolve(document.hasFocus());
        }, 100);
    });
}

// 自动读取剪贴板功能（支持iframe环境）
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

    // 检查是否在iframe中
    const inIframe = isInIframe();
    if (inIframe) {
        console.log('检测到iframe环境，尝试获取焦点...');

        // 尝试获取焦点
        const hasFocus = await tryToFocus();
        if (!hasFocus) {
            console.log('iframe无法获取焦点，将添加用户交互提示');
            addClipboardButton();
            return;
        }
    }

    // 读取剪贴板内容
    try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
            contentInput.value = text.trim();
            console.log('已自动读取剪贴板内容');

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

        // 如果是因为焦点问题，尝试其他方法
        if (err.message.includes('not focused') || err.message.includes('Document is not focused')) {
            // 首先尝试通过父窗口获取剪贴板内容
            if (inIframe) {
                requestClipboardFromParent();

                // 等待一段时间，如果没有收到父窗口的响应，则显示手动按钮
                setTimeout(() => {
                    const contentInput = document.getElementById('content-input');
                    if (contentInput && !contentInput.value.trim()) {
                        addClipboardButton();
                    }
                }, 1000);
            } else {
                addClipboardButton();
            }
        }
    }
}

// 添加手动读取剪贴板按钮
function addClipboardButton() {
    // 检查是否已经添加了按钮
    if (document.getElementById('clipboard-btn')) {
        return;
    }

    const inputSection = document.querySelector('.input-section');
    if (!inputSection) return;

    // 创建提示信息
    const tipDiv = document.createElement('div');
    tipDiv.className = 'clipboard-tip';
    tipDiv.innerHTML = '💡 在浏览器插件中无法自动读取剪贴板，请点击下方按钮手动读取';
    tipDiv.style.cssText = `
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 8px 12px;
        font-size: 0.875rem;
        border-radius: 4px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
    `;

    // 创建剪贴板按钮
    const clipboardBtn = document.createElement('button');
    clipboardBtn.id = 'clipboard-btn';
    clipboardBtn.type = 'button';
    clipboardBtn.className = 'clipboard-btn';
    clipboardBtn.innerHTML = '📋 读取剪贴板内容';
    clipboardBtn.title = '点击读取系统剪贴板内容';

    // 点击事件
    clipboardBtn.addEventListener('click', async function () {
        const contentInput = document.getElementById('content-input');
        if (!contentInput) return;

        // 添加加载状态
        const originalText = this.innerHTML;
        this.innerHTML = '⏳ 读取中...';
        this.disabled = true;

        try {
            // 先聚焦到输入框
            contentInput.focus();

            // 稍微延迟以确保焦点生效
            await new Promise(resolve => setTimeout(resolve, 100));

            // 读取剪贴板
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                contentInput.value = text.trim();

                // 更新清空按钮状态
                const textareaContainer = document.querySelector('.textarea-container');
                if (textareaContainer) {
                    textareaContainer.classList.add('has-content');
                }

                // 显示成功提示
                if (typeof showNotification === 'function') {
                    showNotification('已读取剪贴板内容');
                }

                // 隐藏提示和按钮
                tipDiv.style.display = 'none';
                this.style.display = 'none';
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('剪贴板为空');
                }
            }
        } catch (err) {
            console.error('读取剪贴板失败:', err);
            if (typeof showNotification === 'function') {
                showNotification('读取剪贴板失败，请使用 Ctrl+V 手动粘贴');
            }
        } finally {
            // 恢复按钮状态
            this.innerHTML = originalText;
            this.disabled = false;
        }
    });

    // 将提示和按钮插入到输入区域的开头
    inputSection.insertBefore(tipDiv, inputSection.firstChild);
    inputSection.insertBefore(clipboardBtn, tipDiv.nextSibling);
}

// 隐藏剪贴板按钮和提示
function hideClipboardButton() {
    const clipboardBtn = document.getElementById('clipboard-btn');
    const clipboardTip = document.querySelector('.clipboard-tip');

    if (clipboardBtn) {
        clipboardBtn.style.display = 'none';
    }

    if (clipboardTip) {
        clipboardTip.style.display = 'none';
    }
}