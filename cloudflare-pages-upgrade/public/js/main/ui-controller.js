// UI控制和界面交互功能
class UIController {
    constructor() {
        this.initialDataLoaded = false;
        this.currentFilter = 'cache';
        this.init();
    }

    init() {
        // 获取相关元素
        this.elements = {
            header: document.querySelector('.header'),
            backToTopBtn: document.getElementById('backToTop'),
            batchOperationBtn: document.getElementById('batchOperation'),
            container: document.querySelector('.container'),
            textarea: document.getElementById('content-input'),
            clearBtn: document.getElementById('clearBtn'),
            textareaContainer: document.querySelector('.textarea-container')
        };

        this.setupBatchToolbar();
        this.setupScrollHandling();
        this.setupClearButton();
        this.setupEventListeners();
        this.checkInitialMessage();
    }

    // 创建批量操作工具栏
    setupBatchToolbar() {
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
    }

    // 设置滚动处理
    setupScrollHandling() {
        const { header, backToTopBtn, container } = this.elements;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // 固定标题栏逻辑
            if (scrollTop > header.offsetTop) {
                header.classList.add('header-fixed');
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
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 设置清空按钮功能
    setupClearButton() {
        const { textarea, clearBtn, textareaContainer } = this.elements;

        if (!textarea || !clearBtn || !textareaContainer) return;

        // 监听textarea内容变化
        const updateClearButtonVisibility = () => {
            const hasText = textarea.value.trim().length > 0;
            const hasImages = window.clipboardHandler && window.clipboardHandler.hasImages();

            if (hasText || hasImages) {
                textareaContainer.classList.add('has-content');
            } else {
                textareaContainer.classList.remove('has-content');
            }
        };

        // 清空内容的函数
        const clearTextarea = () => {
            if (window.clipboardHandler) {
                window.clipboardHandler.clearAll();
            } else {
                textarea.value = '';
                updateClearButtonVisibility();
            }
            textarea.focus();
            if (typeof showNotification === 'function') {
                showNotification('内容已清空');
            }
        };

        // 监听输入事件
        textarea.addEventListener('input', updateClearButtonVisibility);
        textarea.addEventListener('paste', () => {
            setTimeout(updateClearButtonVisibility, 10);
        });

        // 清空按钮点击事件
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTextarea();
        });

        // 键盘快捷键支持
        textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
                e.preventDefault();
                clearTextarea();
            }
        });

        // 初始化时检查内容
        updateClearButtonVisibility();
    }

    // 设置事件监听器
    setupEventListeners() {
        const { batchOperationBtn } = this.elements;

        // 批量操作按钮点击事件
        batchOperationBtn.addEventListener('click', () => {
            this.enterBatchMode();
        });

        // 完成按钮点击事件
        document.querySelector('.batch-toolbar .complete-btn').addEventListener('click', () => {
            this.exitBatchMode();
        });

        // 批量删除按钮点击事件
        document.querySelector('.batch-toolbar .delete-btn').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.record-checkbox:checked');
            const ids = Array.from(checkboxes).map(cb => cb.dataset.id);

            if (ids.length > 0) {
                this.batchDeleteRecords(ids);
            }
        });

        // 监听复选框变化以更新计数
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('record-checkbox')) {
                this.updateBatchToolbarCount();
            }
        });
    }

    // 检查初始消息
    checkInitialMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('saved')) {
            if (typeof showNotification === 'function') {
                showNotification('内容已保存到云端');
            }
        }
    }

    // 进入批量模式
    enterBatchMode() {
        document.body.classList.add('batch-mode');
        const batchToolbar = document.getElementById('batchToolbar');
        if (batchToolbar) {
            batchToolbar.classList.add('show');
        }

        // 显示所有复选框
        const records = document.querySelectorAll('.record-item');
        records.forEach(record => {
            record.classList.add('batch-mode');
        });

        this.updateBatchToolbarCount();
    }

    // 退出批量模式
    exitBatchMode() {
        document.body.classList.remove('batch-mode');
        const batchToolbar = document.getElementById('batchToolbar');
        if (batchToolbar) {
            batchToolbar.classList.remove('show');
        }

        // 隐藏所有复选框并取消选中
        const records = document.querySelectorAll('.record-item');
        records.forEach(record => {
            record.classList.remove('batch-mode');
            const checkbox = record.querySelector('.record-checkbox');
            if (checkbox) {
                checkbox.checked = false;
            }
        });
    }

    // 更新批量工具栏计数
    updateBatchToolbarCount() {
        const checkboxes = document.querySelectorAll('.record-checkbox:checked');
        const count = checkboxes.length;
        
        const countElement = document.querySelector('.batch-toolbar .count');
        const deleteBtn = document.querySelector('.batch-toolbar .delete-btn');
        
        if (countElement) {
            countElement.textContent = `已选择 ${count} 项`;
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = count === 0;
        }
    }

    // 批量删除记录
    batchDeleteRecords(ids) {
        if (typeof batchDeleteRecords === 'function') {
            batchDeleteRecords(ids);
        } else {
            console.error('batchDeleteRecords function not found');
        }
    }

    // 自动读取剪贴板功能
    async autoReadClipboard() {
        // 检查是否为HTTPS环境
        if (window.location.protocol !== 'https:') {
            console.log('需要HTTPS环境才能访问剪贴板');
            return;
        }

        // 检查浏览器是否支持剪贴板API
        if (!navigator.clipboard) {
            console.log('浏览器不支持剪贴板API');
            return;
        }

        const { textarea } = this.elements;
        if (!textarea) {
            console.log('未找到内容输入框');
            return;
        }

        // 如果输入框已有内容或已有图片，不覆盖
        if (textarea.value.trim() || (window.clipboardHandler && window.clipboardHandler.hasImages())) {
            console.log('已有内容，跳过自动读取剪贴板');
            return;
        }

        // 尝试使用剪贴板处理器自动读取
        if (window.clipboardHandler) {
            try {
                await window.clipboardHandler.readClipboard();
            } catch (err) {
                console.log('自动读取剪贴板失败:', err.message);
                // 如果新API失败，尝试只读取文本
                try {
                    if (navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text && text.trim()) {
                            textarea.value = text.trim();

                            // 更新清空按钮状态
                            const { textareaContainer } = this.elements;
                            if (textareaContainer) {
                                textareaContainer.classList.add('has-content');
                            }

                            // 显示提示信息
                            if (typeof showNotification === 'function') {
                                showNotification('已自动读取剪贴板文本');
                            }
                        }
                    }
                } catch (textErr) {
                    console.log('无法读取剪贴板文本:', textEr