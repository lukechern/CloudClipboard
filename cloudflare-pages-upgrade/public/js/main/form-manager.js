// 表单处理和数据提交功能
class FormManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormSubmission();
    }

    // 设置表单提交处理
    setupFormSubmission() {
        const bindFormSubmission_7ree = () => {
            const form = document.querySelector('.input-section form');
            if (form) {
                // 防止重复绑定
                if (this._formSubmitHandler_7ree) {
                    form.removeEventListener('submit', this._formSubmitHandler_7ree);
                }
                this._formSubmitHandler_7ree = (e) => this.handleFormSubmit(e);
                form.addEventListener('submit', this._formSubmitHandler_7ree);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindFormSubmission_7ree);
        } else {
            // 如果DOMContentLoaded已触发，立即绑定
            bindFormSubmission_7ree();
        }
    }

    // 处理表单提交
    handleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const textarea = form.querySelector('textarea');
        const submitBtn = form.querySelector('button[type="submit"]');

        // 获取表单数据
        const content = textarea.value.trim();
        const hasImages = window.clipboardHandler && window.clipboardHandler.hasImages();

        // 验证内容是否为空
        if (!content && !hasImages) {
            if (typeof showNotification === 'function') {
                showNotification('请输入要保存的内容或添加图片');
            }
            return;
        }

        // 添加加载状态
        if (submitBtn) {
            this.showLoadingState(submitBtn);
        }

        // 创建请求数据
        const formData = this.createFormData(content, hasImages);

        // 发送请求
        this.submitForm(formData, textarea, submitBtn, hasImages, content);
    }

    // 创建表单数据
    createFormData(content, hasImages) {
        const formData = new FormData();

        // 添加文本内容
        if (content) {
            formData.append('content', content);
        } else if (hasImages) {
            // 如果只有图片没有文本，添加默认描述作为内容
            const imageCount = window.clipboardHandler.getImageCount();
            const defaultContent = `[图片内容] ${imageCount}张图片`;
            formData.append('content', defaultContent);
        }

        // 添加图片数据
        if (hasImages) {
            const imagesData = window.clipboardHandler.getImagesData();

            // 分离原图和缩略图数据
            const originalImages = imagesData.map(img => ({
                base64: img.base64,
                type: img.type,
                size: img.size
            }));

            const thumbnailImages = imagesData.map(img => ({
                base64: img.thumbnail || img.base64, // 如果没有缩略图，使用原图
                type: img.type,
                size: img.size
            }));

            formData.append('images', JSON.stringify(originalImages));
            formData.append('thumbnails', JSON.stringify(thumbnailImages));

            if (content) {
                formData.append('content_type', 'mixed'); // 标识为混合内容
            } else {
                formData.append('content_type', 'image'); // 标识为纯图片
            }
        } else {
            formData.append('content_type', 'text'); // 标识为纯文本
        }

        return formData;
    }

    // 提交表单
    submitForm(formData, textarea, submitBtn, hasImages, content) {
        // 发送请求 - 使用智能fetch自动处理token刷新
        const fetchPromise = window.authManager ?
            window.authManager.smartFetch('/api/records', {
                method: 'POST',
                body: formData
            }) :
            fetch('/api/records', {
                method: 'POST',
                body: formData
            });

        fetchPromise
            .then(async response => {
                console.log('保存请求响应状态:', response.status);

                if (!response.ok) {
                    // 尝试获取详细错误信息
                    let errorMessage = '网络响应失败';
                    try {
                        const errorData = await response.json();
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        }
                    } catch (e) {
                        // 如果无法解析JSON，使用状态码信息
                        errorMessage = `网络响应失败 (状态码: ${response.status})`;
                    }
                    throw new Error(errorMessage);
                }
                return response.json();
            })
            .then(data => {
                // 检查服务器返回的是否是错误信息
                if (data.error) {
                    throw new Error(data.error);
                }

                this.handleSubmitSuccess(textarea, submitBtn, hasImages, content);
            })
            .catch(error => {
                this.handleSubmitError(error, submitBtn);
            });
    }

    // 处理提交成功
    handleSubmitSuccess(textarea, submitBtn, hasImages, content) {
        // 清空表单内容
        if (window.clipboardHandler) {
            window.clipboardHandler.clearAll();
        } else {
            textarea.value = '';
            const textareaContainer = document.querySelector('.textarea-container');
            if (textareaContainer) {
                textareaContainer.classList.remove('has-content');
            }
        }

        if (submitBtn) {
            this.restoreButtonState(submitBtn);
        }

        // 重新加载当前过滤器的记录
        if (typeof loadRecords === 'function') {
            loadRecords(window.currentFilter || 'cache');
        }

        // 显示成功消息
        let successMessage = '内容已保存到云端';
        if (hasImages && !content) {
            successMessage = '图片已保存到云端';
        } else if (hasImages && content) {
            successMessage = '文本和图片已保存到云端';
        }
        
        if (typeof showNotification === 'function') {
            showNotification(successMessage);
        }
    }

    // 处理提交错误
    handleSubmitError(error, submitBtn) {
        console.error('保存错误详情:', error);
        console.error('认证管理器状态:', {
            isAuthenticated: window.authManager?.isAuthenticated,
            hasAuthToken: !!window.authManager?.authToken,
            hasCSRFToken: !!window.authManager?.csrfToken,
            usesCookies: window.authManager?.usesCookies
        });

        if (typeof showNotification === 'function') {
            showNotification('保存失败: ' + (error.message || '未知错误'));
        }

        if (submitBtn) {
            this.restoreButtonState(submitBtn);
        }
    }

    // 显示加载状态
    showLoadingState(button) {
        if (typeof showLoadingState === 'function') {
            showLoadingState(button);
        } else {
            button.disabled = true;
            const originalText = button.textContent;
            button.dataset.originalText = originalText;
            button.textContent = '保存中...';
        }
    }

    // 恢复按钮状态
    restoreButtonState(button) {
        if (typeof restoreButtonState === 'function') {
            restoreButtonState(button);
        } else {
            button.disabled = false;
            const originalText = button.dataset.originalText;
            if (originalText) {
                button.textContent = originalText;
                delete button.dataset.originalText;
            } else {
                button.textContent = '发送到云端';
            }
        }
    }
}

window.FormManager = FormManager;