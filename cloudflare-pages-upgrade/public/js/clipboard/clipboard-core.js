// 剪贴板核心处理功能
class ClipboardCore {
    constructor() {
        this.currentImages = [];
        this.init();
    }

    init() {
        // 绑定上传按钮事件
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => this.handleUploadClick());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // 绑定移除图片按钮事件
        const removeImageBtn = document.getElementById('removeImageBtn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.clearImages());
        }

        // 监听全局粘贴事件
        document.addEventListener('paste', (e) => this.handlePaste(e));

        // 监听键盘快捷键（只在textarea之外的区域触发）
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // 检查焦点是否在textarea上，如果是则不处理（避免重复）
                const activeElement = document.activeElement;
                const textarea = document.getElementById('content-input');
                
                if (activeElement !== textarea) {
                    // 只在textarea之外才检查剪贴板
                    setTimeout(() => this.checkClipboard(), 100);
                }
            }
        });
    }

    handleUploadClick() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    async handleFileSelect(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        let addedCount = 0;
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                await this.addImage(file);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            if (typeof showNotification === 'function') {
                showNotification(`已添加 ${addedCount} 张图片`);
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification('请选择图片文件');
            }
        }

        // 清空文件输入，允许重复选择相同文件
        event.target.value = '';
    }

    async checkClipboard() {
        try {
            await this.readClipboard();
        } catch (error) {
            // 静默处理错误，避免频繁提示
            console.log('检查剪贴板失败:', error.message);
        }
    }

    async readClipboard() {
        if (!navigator.clipboard) {
            throw new Error('浏览器不支持剪贴板API');
        }

        // 检查当前输入框是否有内容，如果有则不自动覆盖
        const textarea = document.getElementById('content-input');
        const hasExistingContent = textarea && textarea.value.trim();
        const hasExistingImages = this.currentImages.length > 0;
        
        if (hasExistingContent || hasExistingImages) {
            console.log('已有内容，跳过自动读取剪贴板');
            return;
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

            if (hasContent && typeof showNotification === 'function') {
                showNotification('已从剪贴板添加内容');
            }

        } catch (error) {
            // 如果新API失败，尝试旧的文本API
            try {
                const text = await navigator.clipboard.readText();
                if (text.trim()) {
                    this.addText(text.trim());
                    if (typeof showNotification === 'function') {
                        showNotification('已从剪贴板添加文本');
                    }
                } else {
                    throw new Error('剪贴板为空');
                }
            } catch (textError) {
                throw new Error('无法访问剪贴板内容');
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

        // 如果有图片，阻止默认的粘贴行为
        if (hasImage) {
            event.preventDefault();
            
            // 如果同时有文本，手动处理文本
            if (hasText) {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                        this.addText(text.trim());
                    }
                } catch (error) {
                    console.log('无法读取文本内容:', error.message);
                }
            }
            
            if (typeof showNotification === 'function') {
                const message = hasText ? '已添加图片和文本内容' : '已添加图片到预览区域';
                showNotification(message);
            }
        }
        // 如果只有文本，让浏览器默认处理，不需要额外操作
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
            // 使用图片处理器处理图片
            const imageData = await window.imageProcessor.processImage(file);
            
            this.currentImages.push(imageData);
            window.uiManager.updateImagePreview(this.currentImages);
            
        } catch (error) {
            console.error('处理图片失败:', error);
            if (typeof showNotification === 'function') {
                showNotification('处理图片失败');
            }
        }
    }

    addText(text) {
        const textarea = document.getElementById('content-input');
        if (textarea && text && text.trim()) {
            const trimmedText = text.trim();
            const currentValue = textarea.value.trim();
            
            // 检查是否已经包含这个文本（避免重复添加）
            if (currentValue.includes(trimmedText) || trimmedText.includes(currentValue)) {
                console.log('文本内容已存在，跳过添加');
                return;
            }
            
            // 如果textarea为空，直接设置文本
            if (!currentValue) {
                textarea.value = trimmedText;
            } else {
                // 如果有内容，追加文本
                textarea.value += '\n' + trimmedText;
            }

            // 更新UI状态
            if (window.uiManager) {
                window.uiManager.updateClearButtonVisibility(textarea.value.trim().length > 0, this.currentImages.length > 0);
                window.uiManager.updateImagePreview(this.currentImages);
            }

            if (typeof showNotification === 'function') {
                showNotification('已添加文本内容');
            }
        }
    }

    clearImages() {
        this.currentImages = [];
        window.uiManager.updateImagePreview(this.currentImages);
        window.uiManager.restoreNormalMode();
        
        if (typeof showNotification === 'function') {
            showNotification('已清除所有图片');
        }
    }

    // 获取当前图片数据，用于表单提交
    getImagesData() {
        return this.currentImages.map(img => ({
            base64: img.base64,
            thumbnail: img.thumbnail,
            type: img.type,
            size: img.size
        }));
    }

    // 检查是否有图片
    hasImages() {
        return this.currentImages.length > 0;
    }

    // 获取图片数量
    getImageCount() {
        return this.currentImages.length;
    }

    // 清空所有内容（文本和图片）
    clearAll() {
        const textarea = document.getElementById('content-input');
        
        // 清空文本
        if (textarea) {
            textarea.value = '';
        }
        
        // 清空图片
        this.currentImages = [];
        
        // 更新UI
        window.uiManager.clearAll();
    }
}