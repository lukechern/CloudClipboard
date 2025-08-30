// 剪贴板图片处理功能
class ClipboardImageHandler {
    constructor() {
        this.currentImages = [];
        this.init();
    }

    init() {
        // 绑定粘贴按钮事件
        const pasteBtn = document.getElementById('pasteBtn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.handlePasteClick());
        }

        // 绑定移除图片按钮事件
        const removeImageBtn = document.getElementById('removeImageBtn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.clearImages());
        }

        // 监听全局粘贴事件
        document.addEventListener('paste', (e) => this.handlePaste(e));

        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // Ctrl+V 或 Cmd+V
                setTimeout(() => this.checkClipboard(), 100);
            }
        });
    }

    async handlePasteClick() {
        try {
            await this.readClipboard();
        } catch (error) {
            console.error('读取剪贴板失败:', error);
            if (typeof showNotification === 'function') {
                showNotification('读取剪贴板失败: ' + error.message);
            }
        }
    }

    async handlePaste(event) {
        const items = event.clipboardData?.items;
        if (!items) return;

        let hasImage = false;
        let hasText = false;

        // 检查剪贴板内容类型
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                hasImage = true;
                const file = item.getAsFile();
                if (file) {
                    await this.addImage(file);
                }
            } else if (item.type === 'text/plain') {
                hasText = true;
            }
        }

        // 如果有图片，阻止默认的文本粘贴行为
        if (hasImage) {
            event.preventDefault();
            if (typeof showNotification === 'function') {
                showNotification('已添加图片到预览区域');
            }
        }
    }

    async readClipboard() {
        if (!navigator.clipboard) {
            throw new Error('浏览器不支持剪贴板API');
        }

        try {
            // 尝试读取剪贴板内容
            const clipboardItems = await navigator.clipboard.read();
            
            let hasContent = false;

            for (const clipboardItem of clipboardItems) {
                // 处理图片
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        await this.addImage(blob);
                        hasContent = true;
                    }
                }

                // 处理文本
                if (clipboardItem.types.includes('text/plain')) {
                    const textBlob = await clipboardItem.getType('text/plain');
                    const text = await textBlob.text();
                    if (text.trim()) {
                        this.addText(text.trim());
                        hasContent = true;
                    }
                }
            }

            if (!hasContent) {
                if (typeof showNotification === 'function') {
                    showNotification('剪贴板中没有可用内容');
                }
            }

        } catch (error) {
            // 如果新API失败，尝试旧的文本API
            try {
                const text = await navigator.clipboard.readText();
                if (text.trim()) {
                    this.addText(text.trim());
                } else {
                    throw new Error('剪贴板为空');
                }
            } catch (textError) {
                throw new Error('无法访问剪贴板内容');
            }
        }
    }

    async addImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        // 检查文件大小 (限制为5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            if (typeof showNotification === 'function') {
                showNotification('图片文件过大，请选择小于5MB的图片');
            }
            return;
        }

        try {
            // 转换为base64
            const base64 = await this.fileToBase64(file);
            
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                base64: base64,
                type: file.type,
                size: file.size
            };

            this.currentImages.push(imageData);
            this.updateImagePreview();
            
        } catch (error) {
            console.error('处理图片失败:', error);
            if (typeof showNotification === 'function') {
                showNotification('处理图片失败');
            }
        }
    }

    addText(text) {
        const textarea = document.getElementById('content-input');
        if (textarea) {
            // 如果textarea为空，直接设置文本
            if (!textarea.value.trim()) {
                textarea.value = text;
            } else {
                // 如果有内容，追加文本
                textarea.value += '\n' + text;
            }

            // 更新清空按钮状态
            const textareaContainer = document.querySelector('.textarea-container');
            if (textareaContainer) {
                textareaContainer.classList.add('has-content');
            }

            // 重新更新预览状态（可能需要显示文本框）
            this.updateImagePreview();

            if (typeof showNotification === 'function') {
                showNotification('已添加文本内容');
            }
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    updateImagePreview() {
        const container = document.getElementById('imagePreviewContainer');
        const preview = document.getElementById('imagePreview');
        const textareaContainer = document.querySelector('.textarea-container');
        const inputSection = document.querySelector('.input-section');
        
        if (!container || !preview) return;

        if (this.currentImages.length === 0) {
            container.style.display = 'none';
            // 恢复文本框显示
            if (textareaContainer) {
                textareaContainer.style.display = 'block';
            }
            if (inputSection) {
                inputSection.classList.remove('image-only-mode');
            }
            // 恢复textarea的required属性
            const textarea = document.getElementById('content-input');
            if (textarea) {
                textarea.setAttribute('required', '');
            }
        } else {
            container.style.display = 'block';
            
            preview.innerHTML = '';
            
            this.currentImages.forEach((imageData, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = imageData.base64;
                imgElement.alt = `预览图片 ${index + 1}`;
                imgElement.title = `${imageData.type} - ${this.formatFileSize(imageData.size)}`;
                
                preview.appendChild(imgElement);
            });

            // 检查是否只有图片没有文本
            const textarea = document.getElementById('content-input');
            const hasText = textarea && textarea.value.trim().length > 0;
            const titleElement = document.querySelector('.image-preview-title');
            
            if (!hasText) {
                // 只有图片时隐藏文本框
                if (textareaContainer) {
                    textareaContainer.style.display = 'none';
                }
                if (inputSection) {
                    inputSection.classList.add('image-only-mode');
                }
                if (titleElement) {
                    titleElement.textContent = '准备发送图片到云端';
                }
                // 移除textarea的required属性，避免表单验证错误
                if (textarea) {
                    textarea.removeAttribute('required');
                }
            } else {
                // 有文本时显示文本框
                if (textareaContainer) {
                    textareaContainer.style.display = 'block';
                }
                if (inputSection) {
                    inputSection.classList.remove('image-only-mode');
                }
                if (titleElement) {
                    titleElement.textContent = '图片预览';
                }
                // 恢复textarea的required属性
                if (textarea) {
                    textarea.setAttribute('required', '');
                }
            }
        }

        // 通知主界面更新清空按钮状态
        this.updateClearButtonVisibility();
    }

    updateClearButtonVisibility() {
        const textarea = document.getElementById('content-input');
        const textareaContainer = document.querySelector('.textarea-container');
        
        if (!textarea || !textareaContainer) return;

        const hasText = textarea.value.trim().length > 0;
        const hasImages = this.currentImages.length > 0;
        
        if (hasText || hasImages) {
            textareaContainer.classList.add('has-content');
        } else {
            textareaContainer.classList.remove('has-content');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    clearImages() {
        this.currentImages = [];
        this.updateImagePreview();
        
        // 恢复文本框显示
        const textareaContainer = document.querySelector('.textarea-container');
        const inputSection = document.querySelector('.input-section');
        const textarea = document.getElementById('content-input');
        
        if (textareaContainer) {
            textareaContainer.style.display = 'block';
        }
        if (inputSection) {
            inputSection.classList.remove('image-only-mode');
        }
        // 恢复textarea的required属性
        if (textarea) {
            textarea.setAttribute('required', '');
        }
        
        if (typeof showNotification === 'function') {
            showNotification('已清除所有图片');
        }
    }

    // 获取当前图片数据，用于表单提交
    getImagesData() {
        return this.currentImages.map(img => ({
            base64: img.base64,
            type: img.type,
            size: img.size
        }));
    }

    // 检查是否有图片
    hasImages() {
        return this.currentImages.length > 0;
    }

    // 清空所有内容（文本和图片）
    clearAll() {
        const textarea = document.getElementById('content-input');
        const textareaContainer = document.querySelector('.textarea-container');
        const inputSection = document.querySelector('.input-section');
        
        // 清空文本
        if (textarea) {
            textarea.value = '';
            // 恢复textarea的required属性
            textarea.setAttribute('required', '');
        }
        
        if (textareaContainer) {
            textareaContainer.classList.remove('has-content');
            textareaContainer.style.display = 'block'; // 确保文本框显示
        }

        // 清空图片
        this.currentImages = [];
        this.updateImagePreview();
        
        // 恢复正常模式
        if (inputSection) {
            inputSection.classList.remove('image-only-mode');
        }
    }
}

// 全局实例
window.clipboardHandler = new ClipboardImageHandler();