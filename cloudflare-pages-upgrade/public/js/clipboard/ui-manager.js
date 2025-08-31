// UI管理和界面更新功能
class UIManager {
    constructor() {
        this.elements = this.initElements();
    }

    initElements() {
        return {
            container: document.getElementById('imagePreviewContainer'),
            preview: document.getElementById('imagePreview'),
            textareaContainer: document.querySelector('.textarea-container'),
            inputSection: document.querySelector('.input-section'),
            textarea: document.getElementById('content-input'),
            titleElement: document.querySelector('.image-preview-title')
        };
    }

    updateImagePreview(currentImages) {
        const { container, preview, textareaContainer, inputSection, textarea, titleElement } = this.elements;
        
        if (!container || !preview) return;

        if (currentImages.length === 0) {
            container.style.display = 'none';
            // 恢复文本框显示
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
        } else {
            container.style.display = 'block';
            
            preview.innerHTML = '';
            
            currentImages.forEach((imageData, index) => {
                const imgElement = document.createElement('img');
                // 使用缩略图进行预览，如果没有缩略图则使用原图
                imgElement.src = imageData.thumbnail || imageData.base64;
                imgElement.alt = `预览图片 ${index + 1}`;
                imgElement.title = `${imageData.type} - ${window.imageProcessor.formatFileSize(imageData.size)}`;
                
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
            const hasText = textarea && textarea.value.trim().length > 0;
            
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

        // 更新清空按钮状态
        const hasText = textarea && textarea.value.trim().length > 0;
        this.updateClearButtonVisibility(hasText, currentImages.length > 0);
    }

    updateClearButtonVisibility(hasText, hasImages) {
        const { textareaContainer } = this.elements;
        
        if (!textareaContainer) return;
        
        if (hasText || hasImages) {
            textareaContainer.classList.add('has-content');
        } else {
            textareaContainer.classList.remove('has-content');
        }
    }

    restoreNormalMode() {
        const { textareaContainer, inputSection, textarea } = this.elements;
        
        // 恢复文本框显示
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
    }

    clearAll() {
        const { textareaContainer, inputSection, textarea } = this.elements;
        
        if (textareaContainer) {
            textareaContainer.classList.remove('has-content');
            textareaContainer.style.display = 'block'; // 确保文本框显示
        }

        // 恢复正常模式
        if (inputSection) {
            inputSection.classList.remove('image-only-mode');
        }

        // 恢复textarea的required属性
        if (textarea) {
            textarea.setAttribute('required', '');
        }

        // 清空预览容器
        this.updateImagePreview([]);
    }

    // 刷新元素引用（在DOM变化后调用）
    refreshElements() {
        this.elements = this.initElements();
    }
}