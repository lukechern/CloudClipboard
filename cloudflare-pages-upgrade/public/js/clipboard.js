// 剪贴板图片处理功能
class ClipboardImageHandler {
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

        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // Ctrl+V 或 Cmd+V - 检查是否有新的剪贴板内容
                setTimeout(() => this.checkClipboard(), 100);
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
            
            // 生成缩略图
            const thumbnail = await this.generateThumbnail(file, 200, 200);
            
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                base64: base64,           // 原图
                thumbnail: thumbnail,     // 缩略图
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

    // 生成缩略图
    generateThumbnail(file, maxWidth = 200, maxHeight = 200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // 计算缩略图尺寸，保持宽高比
                let { width, height } = this.calculateThumbnailSize(
                    img.width, img.height, maxWidth, maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制缩略图
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为base64
                const thumbnailBase64 = canvas.toDataURL(file.type, quality);
                resolve(thumbnailBase64);
            };
            
            img.onerror = () => reject(new Error('无法加载图片'));
            
            // 从文件创建图片URL
            const url = URL.createObjectURL(file);
            img.src = url;
            
            // 清理URL
            img.onload = () => {
                URL.revokeObjectURL(url);
                // 计算缩略图尺寸，保持宽高比
                let { width, height } = this.calculateThumbnailSize(
                    img.width, img.height, maxWidth, maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制缩略图
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为base64
                const thumbnailBase64 = canvas.toDataURL(file.type, quality);
                resolve(thumbnailBase64);
            };
        });
    }

    // 计算缩略图尺寸，保持宽高比
    calculateThumbnailSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // 如果图片尺寸小于最大尺寸，直接返回原尺寸
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }
        
        // 计算缩放比例
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio)
        };
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
                // 使用缩略图进行预览，如果没有缩略图则使用原图
                imgElement.src = imageData.thumbnail || imageData.base64;
                imgElement.alt = `预览图片 ${index + 1}`;
                imgElement.title = `${imageData.type} - ${this.formatFileSize(imageData.size)}`;
                
                // 点击预览图片时查看原图
                imgElement.addEventListener('click', () => {
                    if (typeof viewImage === 'function') {
                        viewImage(imageData.base64, imageData.type);
                    }
                });
                imgElement.style.cursor = 'pointer';
                
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
            base64: img.base64,        // 原图
            thumbnail: img.thumbnail,  // 缩略图
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